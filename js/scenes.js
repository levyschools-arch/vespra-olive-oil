// Desktop story: one pinned stage. The chapters stay layered in place and hand
// over to each other the way the Explanideo reference does: the grove pulls
// back into a painting on a plaster wall and dissolves, drawings appear as
// outlines before their colour, one olive is picked, opened and pressed, and
// its oil runs down the middle of the screen into a bottle. The wall behind
// changes colour with every chapter. Phone and reduced motion never run this
// file; they keep the native flow.

// ponytail: viewport heights of scroll per timeline second. The pacing knob.
const UNIT = 1.35;

// Chapter start (rail state) and reading point (where a rail click lands), in timeline seconds.
const CHAPTERS = [
  { id: 'intro', start: 0, read: 0 },
  { id: 'hero', start: 1.4, read: 3.3 },
  { id: 'harvest', start: 4.0, read: 4.7 },
  { id: 'press', start: 5.45, read: 7.3 },
  { id: 'oil', start: 12.15, read: 13.4 },
  { id: 'collection', start: 13.75, read: 14.95 },
];

export function initScenes() {
  splitWords();
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
  wall(tl);
  intro(tl);
  hero(tl);
  harvest(tl);
  press(tl);
  pour(tl);
  oil(tl);
  collection(tl);
  drift(tl);
  const story = ScrollTrigger.create({
    id: 'story',
    trigger: '.story',
    animation: tl,
    start: 'top top',
    end: () => `+=${Math.round(innerHeight * UNIT * tl.duration())}`,
    scrub: true,
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
  });
  finale();
  return setupNavigation(tl, story);
}

// Paragraphs fill in word by word as the visitor scrolls.
function splitWords() {
  document.querySelectorAll('.story .scene-copy p:not(.eyebrow):not(.tagline)').forEach(p => {
    if (p.dataset.split) return;
    p.dataset.split = '1';
    const words = p.textContent.trim().split(/\s+/);
    p.replaceChildren(...words.flatMap((word, i) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.textContent = word;
      return i ? [' ', span] : [span];
    }));
  });
}

// Titles sharpen out of a blur, then the paragraph fills in.
function copyIn(tl, scope, t) {
  tl.fromTo(`${scope} .eyebrow`, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.2 }, t)
    .fromTo(`${scope} h2`, { opacity: 0, y: 40, filter: 'blur(12px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.4, ease: 'power3.out' }, t + 0.05)
    // long paragraphs fill faster per word, so every paragraph is complete with time left to read it
    .fromTo(`${scope} .word`, { opacity: 0 }, { opacity: 1, duration: 0.1, stagger: Math.min(0.03, 0.45 / document.querySelectorAll(`${scope} .word`).length), ease: 'none' }, t + 0.3);
}

function copyOut(tl, scope, t) {
  tl.to(scope, { opacity: 0, y: -50, duration: 0.3, ease: 'power2.in' }, t);
}

// The travelling olive's CSS box, matching .travel-olive in style.css.
const box = () => {
  const w = Math.min(innerWidth * 0.29, 510);
  return { w, h: w * 1186 / 1327 };
};

// Centre the travelling olive at (cx, cy), as viewport fractions, at `size` times its CSS width.
const at = (cx, cy, size) => ({
  x: () => innerWidth * cx - box().w / 2,
  y: () => innerHeight * cy - box().h / 2,
  scale: size,
});

// Where the olive hangs on the branch, and the top of its stem in A05
// (pixel 725, 120 of 1327 x 1186), which the twig has to reach.
const HANG = [0.6, 0.5, 1];
const stem = () => ({
  x: innerWidth * HANG[0] + (725 / 1327 - 0.5) * box().w * HANG[2],
  y: innerHeight * HANG[1] + (120 / 1186 - 0.5) * box().h * HANG[2],
});

// The cellar wall takes a new colour at each chapter, and its pool of light
// moves to where the subject is. Underneath, the whole wall drifts slowly
// upward and closer for the entire story, so the room never stands still.
function wall(tl) {
  const shade = (t, a, b, x, y) => tl.to('.story-bg', { '--bg-a': a, '--bg-b': b, '--bg-x': x, '--bg-y': y, duration: 0.6, ease: 'none' }, t);
  shade(1.4, '#1f2a1a', '#090c07', '62%', '36%');
  shade(4.0, '#2b3a21', '#0e150b', '60%', '48%');
  shade(5.45, '#4a4228', '#16140c', '38%', '44%');
  shade(9.35, '#2c2512', '#0a0907', '50%', '36%');
  shade(13.75, '#3a3014', '#0a0b08', '50%', '52%');
}

function drift(tl) {
  tl.fromTo('.story-bg', { yPercent: 0, scale: 1 }, { yPercent: -14, scale: 1.08, duration: tl.duration() - 1.95, ease: 'none' }, 1.95);
}

function intro(tl) {
  // The painting has been hanging on the wall all along: the opening is just
  // zoomed in on it. Scrolling pulls the camera back, so wall, frame and
  // painting shrink together. Starting at 1.05 keeps the frame's inner lip
  // off-screen on the first frame ...
  tl.to('.scroll-cue', { opacity: 0, duration: 0.2, ease: 'none' }, 0)
    .to('.intro-copy', { opacity: 0, y: -30, duration: 0.35 }, 0.05)
    .fromTo('.intro-window', { scale: 1.05 }, { scale: 0.35, duration: 1.1 }, 0)
    // ... then the camera goes down: the gallery rises out of view, its dark wood
    // fades into the stone, and we arrive in the cellar. The cellar wall moves
    // slower than the gallery above it, which gives the drop its depth.
    .to('#intro, .gallery-fade', { y: () => -innerHeight * 1.7, duration: 0.85, ease: 'power2.inOut' }, 1.1)
    .fromTo('.story-bg', { y: () => innerHeight * 0.3 }, { y: 0, duration: 0.85, ease: 'power2.inOut' }, 1.1);
}

function hero(tl) {
  const t = 1.7;
  tl.fromTo('#hero', { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.inOut' }, t - 0.1)
    // The branch draws as an outline, then its painting fades in over it.
    .fromTo('.hero-branch-line', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'power1.inOut' }, t + 0.05)
    .fromTo('.hero-branch-left', { opacity: 0 }, { opacity: 1, duration: 0.5 }, t + 0.7)
    .to('.hero-branch-line', { opacity: 0.2, duration: 0.4 }, t + 0.9)
    // A twig lowers from the branch and the olive draws on the end of it.
    .set('.twig', { x: () => stem().x - 1.5, y: () => innerHeight * 0.1, height: () => stem().y - innerHeight * 0.1 }, 0)
    .fromTo('.twig', { scaleY: 0 }, { scaleY: 1, duration: 0.4 }, t + 0.4)
    .set('.travel-olive', { ...at(...HANG), opacity: 1 }, t + 0.5)
    .fromTo('.travel-line', { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.45, ease: 'power1.inOut' }, t + 0.55)
    .fromTo('.travel-whole', { opacity: 0 }, { opacity: 1, duration: 0.4 }, t + 1.0)
    .to('.travel-line', { opacity: 0, duration: 0.2 }, t + 1.3);
  copyIn(tl, '.hero-copy', t + 0.35);
  copyOut(tl, '.hero-copy', 3.95);
}

function harvest(tl) {
  const t = 4.0;
  tl.set('#harvest', { opacity: 1 }, t);
  copyIn(tl, '.harvest-copy', t + 0.05);
  // The olive twists on its stem, the twig snaps back and the fruit drops free.
  tl.to('.travel-whole', {
    keyframes: [{ rotation: -12 }, { rotation: 9 }, { rotation: -8 }, { rotation: 5 }],
    transformOrigin: '54.6% 10.1%', duration: 0.5, ease: 'sine.inOut',
  }, t + 0.3)
    .to('.travel-whole', { rotation: 0, duration: 0.05 }, t + 0.85)
    .to('.twig', { scaleY: 0, duration: 0.15, ease: 'power2.in' }, t + 0.85)
    .to('.travel-olive', { ...at(0.6, 0.72, 0.9), rotation: 20, duration: 0.4, ease: 'power2.in' }, t + 0.85)
    .to('.hero-branch-left, .hero-branch-line', { opacity: 0.25, duration: 0.3 }, t + 0.9)
    .fromTo('.harvest-second', { opacity: 0, y: 30, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.25 }, t + 1.0)
    .to('.harvest-second', { opacity: 0, duration: 0.15 }, t + 1.3);
  copyOut(tl, '.harvest-copy', 5.3);
}

function press(tl) {
  const t = 5.45;
  const labels = gsap.utils.toArray('.travel-labels text');
  const cards = gsap.utils.toArray('.press-card');
  tl.fromTo('#press', { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'none' }, t)
    // The scenes are see-through over the wall, so each one leaves explicitly.
    .to('#hero, #harvest', { opacity: 0, duration: 0.4, ease: 'none' }, t)
    // The fallen olive rises into the light to be opened.
    .to('.travel-olive', { ...at(0.36, 0.58, 1.15), rotation: 0, duration: 0.6, ease: 'power3.out' }, t + 0.05)
    // A clean cut wipes across the fruit to reveal the cutaway beneath.
    .fromTo('.travel-cut', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.45 }, t + 0.7)
    .fromTo('.travel-labels path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.3, stagger: 0.15, ease: 'power1.inOut' }, t + 1.05)
    .fromTo(labels, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.2, stagger: 0.15 }, t + 1.2);
  copyIn(tl, '.press-copy', t + 0.25);
  // Cards stack up: each stays in place and the next pops in below it, lighting
  // up its own label. The flesh glows where the oil sits.
  cards.forEach((card, i) => {
    const c = 7.0 + i * 0.75;
    tl.fromTo(card, { opacity: 0, y: 30, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'back.out(1.6)' }, c)
      .to(labels[i], { fill: '#C9A227', duration: 0.15 }, c);
    if (i) tl.to(labels[i - 1], { fill: '#EDE8DC', duration: 0.15 }, c);
  });
  tl.to('.flesh-glow', { opacity: 0.8, duration: 0.25 }, 7.75)
    .to('.flesh-glow', { opacity: 0, duration: 0.2 }, 8.35);
}

// Oil surface inside the bottle, as a percentage of the bottle's height:
// 92 is the inside of the thick glass base, 14.6 is the mouth.
const oilLevel = { y: 92, falling: 0 };
function drawOil() {
  document.querySelector('.fill-full').style.clipPath = `inset(${oilLevel.y}% 0% 0% 0%)`;
  document.querySelector('.fill-stream').style.height = `${(oilLevel.y - 14.6) * oilLevel.falling}%`;
}

function pour(tl) {
  const t = 9.35;
  copyOut(tl, '.press-copy', t);
  tl.to('.travel-labels', { opacity: 0, duration: 0.2 }, t)
    .to('#press', { opacity: 0, duration: 0.3, ease: 'none' }, t + 0.3)
    // The opened olive rises to the top of the screen above an open bottle.
    .to('.travel-olive', { ...at(0.5, 0.12, 0.45), duration: 0.5 }, t + 0.05)
    .fromTo('.fill-bottle', { opacity: 0, yPercent: 30 }, { opacity: 1, yPercent: 0, duration: 0.5, ease: 'power3.out' }, t + 0.5)
    .fromTo('.pour-words', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.1 }, t + 0.55)
    // The oil runs from the olive straight down into the open mouth ...
    .fromTo('.thread', { scaleY: 0, transformOrigin: '50% 0%' }, { scaleY: 1, duration: 0.3, ease: 'power1.in' }, t + 0.9)
    // ... falls inside the glass to the bottom, and the oil rises. The stream
    // always ends at the oil surface, so it shortens as the bottle fills.
    .fromTo(oilLevel, { y: 92, falling: 0 }, { falling: 1, duration: 0.15, ease: 'power1.in', onUpdate: drawOil }, t + 1.2)
    .to(oilLevel, { y: 14.6, duration: 0.75, ease: 'power1.inOut', onUpdate: drawOil }, t + 1.35)
    .to('.travel-olive', { opacity: 0, duration: 0.3 }, t + 1.6)
    .to('.thread', { scaleY: 0, transformOrigin: '50% 100%', duration: 0.2, ease: 'power1.in' }, t + 1.9)
    // The cap drops back on.
    .fromTo('.fill-cap', { opacity: 0, y: () => -innerHeight * 0.06 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.in' }, t + 2.2)
    .to('.pour-words', { opacity: 0, duration: 0.2 }, t + 2.25)
    // Then the camera moves into the full bottle and through into the oil.
    .to('.fill-bottle', { scale: 6, duration: 0.7, ease: 'power2.in' }, t + 2.5)
    .to('.fill-bottle', { opacity: 0, duration: 0.25, ease: 'none' }, t + 2.95);
}

function oil(tl) {
  const t = 12.15;
  tl.fromTo('#oil', { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power1.inOut' }, t - 0.35)
    .fromTo('.oil-backdrop', { scale: 1.3 }, { scale: 1, duration: 1.6, ease: 'power1.out' }, t - 0.35);
  copyIn(tl, '.oil-copy', t + 0.35);
  tl.fromTo('.tasting-notes figure', { opacity: 0, y: 80, skewY: 4, scale: 0.9 },
    { opacity: 1, y: 0, skewY: 0, scale: 1, duration: 0.4, stagger: 0.2, ease: 'back.out(1.3)' }, t + 0.75);
}

function collection(tl) {
  const t = 13.75;
  const images = gsap.utils.toArray('.product-image');
  const stories = gsap.utils.toArray('.product-story');
  const side = sign => ({ x: () => sign * innerWidth * 0.38, y: () => innerHeight * 0.14, rotation: sign * 24, opacity: 0 });
  tl.fromTo('#collection', { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'none' }, t)
    .to('#oil', { opacity: 0, duration: 0.3, ease: 'none' }, t)
    // A gold glow rises from the bottom of the screen.
    .fromTo('.collection-glow', { opacity: 0, yPercent: 60 }, { opacity: 1, yPercent: 0, duration: 0.7, ease: 'power2.out' }, t + 0.1);
  copyIn(tl, '.collection-heading', t + 0.3);
  // Each bottle swings in tilted from the right, stands upright, then tilts away left.
  images.forEach((image, i) => {
    const enter = t + 0.6 + i;
    tl.fromTo(image, side(1), { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }, enter)
      .fromTo(stories[i], { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power3.out' }, enter + 0.25);
    if (i === images.length - 1) return;
    tl.to(image, { ...side(-1), duration: 0.5, ease: 'power2.in' }, enter + 0.75)
      .to(stories[i], { opacity: 0, x: -40, duration: 0.25, ease: 'power2.in' }, enter + 0.75);
  });
  tl.to({}, { duration: 0.6 });
}

function finale() {
  // The three-bottle close is the last screen: it stays put and the footer slides up over it.
  ScrollTrigger.create({
    trigger: '#finale', start: 'top top', end: () => `+=${document.getElementById('site-footer').offsetHeight}`,
    pin: true, pinSpacing: false,
  });
  // The closing page is wiped open from the top as it scrolls in.
  gsap.fromTo('#finale', { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
    scrollTrigger: { trigger: '#finale', start: 'top bottom', end: 'top 15%', scrub: true },
  });
  gsap.fromTo('.finale-backdrop', { yPercent: -18, scale: 1.15 }, { yPercent: 0, scale: 1, ease: 'none',
    scrollTrigger: { trigger: '#finale', start: 'top bottom', end: 'top top', scrub: true },
  });
  gsap.fromTo('.finale-copy', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
    scrollTrigger: { trigger: '#finale', start: 'top 75%', toggleActions: 'play none none reverse' },
  });
  gsap.fromTo('.footer-inner > *', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power2.out',
    scrollTrigger: { trigger: '#site-footer', start: 'top 90%', toggleActions: 'play none none reverse' },
  });
}

function setupNavigation(tl, story) {
  const links = [...document.querySelectorAll('.chapter-rail a')];
  const finale = document.getElementById('finale');
  const setActive = id => {
    links.forEach(link => {
      const active = link.hash === `#${id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  const timeToY = time => story.start + (story.end - story.start) * (time / tl.duration());
  const currentId = () => {
    if (finale.getBoundingClientRect().top <= innerHeight * 0.55) return 'finale';
    const progress = gsap.utils.clamp(0, 1, (scrollY - story.start) / (story.end - story.start));
    const time = progress * tl.duration();
    return CHAPTERS.filter(chapter => chapter.start <= time + 0.001).at(-1).id;
  };
  const targetY = id => {
    const chapter = CHAPTERS.find(item => item.id === id);
    return chapter ? timeToY(chapter.read) : finale.getBoundingClientRect().top + scrollY;
  };
  const syncActive = () => setActive(currentId());
  addEventListener('scroll', syncActive, { passive: true });
  ScrollTrigger.addEventListener('refresh', syncActive);
  requestAnimationFrame(syncActive);

  const isChapter = id => id === 'finale' || CHAPTERS.some(item => item.id === id);
  // Lenis owns the scroll position when present; a native jump alone can be
  // pulled back by a glide Lenis already had in progress.
  const jump = y => {
    if (window.__vespraLenis) window.__vespraLenis.scrollTo(y, { immediate: true, force: true });
    else scrollTo({ top: y, behavior: 'instant' });
  };
  // A direct #chapter load is restored once fonts and pin positions are measured.
  const restoreInitialHash = () => {
    const id = location.hash.slice(1);
    if (!isChapter(id)) return;
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
      jump(targetY(id));
      setActive(id);
    });
  };
  const restoreTimer = setTimeout(restoreInitialHash, 100);
  const onClick = event => {
    const link = event.target.closest('.chapter-rail a, .scroll-cue');
    if (!link) return;
    const id = link.hash.slice(1);
    if (!isChapter(id)) return;
    event.preventDefault();
    jump(targetY(id));
    setActive(id);
    history.replaceState(null, '', `#${id}`);
  };
  document.addEventListener('click', onClick);
  return () => {
    document.removeEventListener('click', onClick);
    removeEventListener('scroll', syncActive);
    clearTimeout(restoreTimer);
    ScrollTrigger.removeEventListener('refresh', syncActive);
  };
}
