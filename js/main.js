import { initScenes } from './scenes.js?v=11';

const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// The opening is the loading screen. The grove starts in grey and the gold bar
// under the tagline fills with real progress (fonts plus the opening images);
// at 100 percent the grove has its full colour and scrolling opens. The fill
// never runs faster than a short minimum, so the title has time to form, and
// gives up after 12 s so a slow image can never trap the visitor.
function runOpeningLoad() {
  const images = [...document.querySelectorAll('.intro-backdrop img, .intro-midground')];
  const waits = [document.fonts.ready, ...images.map(img => img.decode())];
  let finished = 0;
  waits.forEach(wait => wait.catch(() => {}).then(() => { finished += 1; }));
  const minimum = reduceMotion ? 0 : 6500;
  const started = performance.now();
  root.classList.add('is-loading');
  root.style.setProperty('--load', 0);
  root.style.setProperty('--grey', 1);
  return new Promise(resolve => {
    let shown = 0;
    const timer = setInterval(() => {
      const elapsed = performance.now() - started;
      const target = Math.min(finished / waits.length, minimum ? elapsed / minimum : 1);
      shown = elapsed > 12000 ? 1 : Math.max(shown, target);
      root.style.setProperty('--load', shown.toFixed(3));
      // Grey fades unevenly to the eye: a straight line still looks grey at 60 percent.
      // Squaring the remainder makes the colour arrive in step with the bar.
      root.style.setProperty('--grey', ((1 - shown) ** 2.4).toFixed(3));
      if (shown < 1) return;
      clearInterval(timer);
      resolve();
    }, 50);
  });
}

const unlock = () => {
  root.classList.remove('is-loading');
  window.__vespraLenis?.start();
};

// While it loads, the gold oval draws itself and the letters of VESPRA draw
// as outlines, then fill.
function formTitle() {
  gsap.timeline({ defaults: { ease: 'power2.out' } })
    // paced to the 6.5 s loading bar: the tagline arrives as the bar reaches 100 percent
    .fromTo('.intro-copy .eyebrow', { opacity: 0, y: 14, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2 }, 0.4)
    .fromTo('.wordmark-oval', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.8, ease: 'power2.inOut' }, 0.6)
    .fromTo('.wordmark-svg text', { strokeDashoffset: 1500, fillOpacity: 0 }, { strokeDashoffset: 0, duration: 3.2, ease: 'power1.inOut' }, 1.4)
    .to('.wordmark-svg text', { fillOpacity: 1, duration: 1.6 }, 3.8)
    .fromTo('.intro-copy .tagline', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1.2 }, 5.2);
}

function boot() {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const motion = gsap.matchMedia();
  motion.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
    document.body.classList.remove('no-fx');
    document.body.classList.add('fx');

    let lenis;
    let tick;
    if (window.Lenis) {
      lenis = new Lenis({ duration: 1.1 });
      lenis.on('scroll', ScrollTrigger.update);
      tick = time => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      window.__vespraLenis = lenis;
      if (root.classList.contains('is-loading')) lenis.stop();
    }

    // Lenis measures the page once at start, before the pinned story adds its
    // scroll length, and clamps every scrollTo to that stale height.
    const remeasure = () => lenis?.resize();
    ScrollTrigger.addEventListener('refresh', remeasure);

    const cleanupScenes = initScenes();
    document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => {
      ScrollTrigger.removeEventListener('refresh', remeasure);
      cleanupScenes();
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
      window.__vespraLenis = null;
      document.body.classList.remove('fx');
      document.body.classList.add('no-fx');
    };
  });

  if (!reduceMotion) formTitle();
}

// A visitor arriving on a #chapter link can scroll at once; the grove still colours in.
const deepLink = location.hash.length > 1 && location.hash !== '#intro';
const loaded = runOpeningLoad();
boot();
if (deepLink) unlock();
else loaded.then(unlock);
