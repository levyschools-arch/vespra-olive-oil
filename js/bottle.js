import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Procedural glass bottle. GSAP tweens the returned params object;
// the ticker reads it every frame. No model assets.
export function initBottle(canvas) {
  const params = { rotY: 0, tilt: 0, posX: 0, posY: 0, scale: 1, pour: 0, labelIndex: 0, visible: 1 };

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  // studio reflections make the glass read as glass
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 50);
  camera.position.set(0, 1.25, 6.2);
  camera.lookAt(0, 1.25, 0);

  scene.add(new THREE.AmbientLight(0x33352c, 0.5));
  const key = new THREE.SpotLight(0xC9A227, 140, 0, Math.PI / 5, 0.5);
  key.position.set(2.6, 4, 3.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xaabbdd, 1.6);
  rim.position.set(-2, 2.5, -3);
  scene.add(rim);

  const group = new THREE.Group();
  scene.add(group);

  // ---- glass body: tall slender marasca-style profile ----
  const pts = [
    [0.0, 0.0], [0.40, 0.0], [0.44, 0.05], [0.46, 0.30], [0.46, 1.55],
    [0.42, 1.72], [0.24, 1.88], [0.145, 2.02], [0.13, 2.30], [0.13, 2.46],
    [0.0, 2.46],
  ];
  const profile = pts.map(([x, y]) => new THREE.Vector2(x, y));
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x18220f,
    transmission: 0.92, roughness: 0.04, thickness: 0.5, ior: 1.5,
    clearcoat: 1, clearcoatRoughness: 0.06,
    attenuationColor: new THREE.Color(0x6a6a10), attenuationDistance: 1.4,
    envMapIntensity: 1.2, transparent: true,
  });
  const glass = new THREE.Mesh(new THREE.LatheGeometry(profile, 96), glassMat);
  group.add(glass);

  // ---- oil inside ----
  const oilProfile = profile.slice(0, 7).map(p => new THREE.Vector2(p.x * 0.86, p.y * 0.78 + 0.06));
  oilProfile.push(new THREE.Vector2(0, oilProfile[oilProfile.length - 1].y));
  const oil = new THREE.Mesh(
    new THREE.LatheGeometry(oilProfile, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0xC9A227, transmission: 0.65, roughness: 0.2,
      emissive: 0x4a3806, emissiveIntensity: 0.7, transparent: true,
    })
  );
  group.add(oil);

  // ---- cap: dark metal + gold collar ring ----
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.145, 0.145, 0.26, 48),
    new THREE.MeshStandardMaterial({ color: 0x15140f, metalness: 0.85, roughness: 0.35 })
  );
  cap.position.y = 2.56;
  group.add(cap);
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.045, 48),
    new THREE.MeshStandardMaterial({ color: 0xC9A227, metalness: 1, roughness: 0.25 })
  );
  collar.position.y = 2.42;
  group.add(collar);

  // ---- label band with CanvasTexture, 3 designs ----
  const LABELS = [
    { bg: '#EDE8DC', fg: '#0A0B08', name: 'NOCTURNE' },
    { bg: '#1A2014', fg: '#EDE8DC', name: 'RESERVA' },
    { bg: '#C9A227', fg: '#0A0B08', name: 'PRIMERA' },
  ];
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 1024; labelCanvas.height = 256;
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  labelTex.colorSpace = THREE.SRGBColorSpace;
  let lastLabel = 0;
  function drawLabel(i) {
    const { bg, fg, name } = LABELS[i];
    const c = labelCanvas.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = bg; c.fillRect(0, 0, 1024, 256);
    c.save();
    c.translate(512, 0);
    c.fillStyle = fg;
    c.textAlign = 'center';
    c.font = '300 64px Fraunces, serif';
    c.fillText('VESPRA', 0, 104);
    c.font = '500 24px Inter, sans-serif';
    c.fillText(name, 0, 168);
    c.strokeStyle = fg; c.lineWidth = 3;
    c.strokeRect(-165, 28, 330, 194);
    c.restore();
    labelTex.needsUpdate = true;
  }
  drawLabel(0);
  document.fonts.ready.then(() => drawLabel(lastLabel)); // redraw once Fraunces is in
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.472, 0.472, 0.62, 96, 1, true),
    new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.65 })
  );
  label.position.y = 0.92;
  label.rotation.y = Math.PI; // texture center (u=0.5) faces the camera
  group.add(label);

  // ---- pour stream: thin gold cylinder from the lip, scaleY driven by params.pour ----
  const pour = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.042, 1.6, 12),
    new THREE.MeshPhysicalMaterial({ color: 0xC9A227, emissive: 0x6b5410, emissiveIntensity: 1, roughness: 0.1, transmission: 0.5, transparent: true })
  );
  const pourPivot = new THREE.Group();
  pourPivot.position.set(0, 2.46, 0);
  pour.position.y = -0.8;
  pourPivot.add(pour);
  group.add(pourPivot);

  gsap.ticker.add(() => {
    group.rotation.y = params.rotY;
    group.rotation.z = params.tilt;
    group.position.set(params.posX, params.posY, 0);
    group.scale.setScalar(params.scale);
    group.visible = params.visible > 0.01;
    pourPivot.scale.y = Math.max(params.pour, 0.0001);
    pourPivot.visible = params.pour > 0.01;
    pourPivot.rotation.z = -params.tilt;
    const li = Math.round(params.labelIndex);
    if (li !== lastLabel && LABELS[li]) { drawLabel(li); lastLabel = li; }
    renderer.render(scene, camera);
  });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  return params;
}
