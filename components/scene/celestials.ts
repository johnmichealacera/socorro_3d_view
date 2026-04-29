import * as THREE from "three";

// ── PHT phase (matches dayCycle.ts exactly) ───────────────────────────────────

function getPHTPhase(): number {
  const now = new Date();
  const sec = (now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds() + 8 * 3600) % 86400;
  return sec / 86400;
}

const SUNRISE = 6  / 24;
const SUNSET  = 18 / 24;

function computeSunDir(phase: number, out: THREE.Vector3): number {
  const dayFrac  = (phase - SUNRISE) / (SUNSET - SUNRISE);
  const elevNorm = Math.max(0, Math.sin(Math.max(0, Math.min(1, dayFrac)) * Math.PI));
  const elevation   = 2 + elevNorm * 68;
  const sunProgress = Math.max(0, Math.min(1, dayFrac));
  const azimuth     = THREE.MathUtils.degToRad(90 + sunProgress * 180);
  const phi         = THREE.MathUtils.degToRad(90 - elevation);
  out.setFromSphericalCoords(1, phi, azimuth);
  return elevNorm; // 0 below horizon, 1 at peak noon
}

// ── Canvas textures ───────────────────────────────────────────────────────────

function makeSunTex(): THREE.CanvasTexture {
  const W = 256, H = 256;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
  g.addColorStop(0.00, "rgba(255,255,230,1.00)");
  g.addColorStop(0.07, "rgba(255,255,200,0.95)");
  g.addColorStop(0.18, "rgba(255,230,120,0.65)");
  g.addColorStop(0.40, "rgba(255,190,60,0.28)");
  g.addColorStop(0.70, "rgba(255,150,30,0.10)");
  g.addColorStop(1.00, "rgba(255,120,10,0.00)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  return new THREE.CanvasTexture(c);
}

function makeMoonTex(): THREE.CanvasTexture {
  const W = 192, H = 192;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;

  // Soft outer glow halo
  const glow = ctx.createRadialGradient(W / 2, H / 2, W * 0.18, W / 2, H / 2, W / 2);
  glow.addColorStop(0.00, "rgba(215,230,255,0.00)");
  glow.addColorStop(0.35, "rgba(200,220,255,0.12)");
  glow.addColorStop(0.65, "rgba(180,210,255,0.25)");
  glow.addColorStop(1.00, "rgba(160,200,255,0.00)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Crisp disc
  const disc = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.30);
  disc.addColorStop(0.00, "rgba(230,240,255,1.00)");
  disc.addColorStop(0.70, "rgba(210,225,255,0.96)");
  disc.addColorStop(1.00, "rgba(190,210,255,0.00)");
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, W * 0.30, 0, Math.PI * 2);
  ctx.fill();

  // Subtle maria (dark patches)
  const mariaPositions: [number, number, number][] = [
    [0.42, 0.40, 9.0],
    [0.56, 0.48, 6.5],
    [0.38, 0.56, 5.5],
    [0.50, 0.38, 4.5],
  ];
  ctx.globalAlpha = 0.17;
  ctx.fillStyle = "#5a7a8c";
  for (const [fx, fy, r] of mariaPositions) {
    ctx.beginPath();
    ctx.arc(W * fx, H * fy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  return new THREE.CanvasTexture(c);
}

function makeStarField(): THREE.Points {
  const N = 1300;
  const pos   = new Float32Array(N * 3);
  const col   = new Float32Array(N * 3);
  const sizes = new Float32Array(N);

  // Star color palette: white, blue-white, warm-white, yellow, orange
  const palette = [
    [1.00, 1.00, 1.00], [0.88, 0.94, 1.00], [1.00, 0.98, 0.90],
    [1.00, 0.92, 0.72], [1.00, 0.82, 0.62],
  ];
  const weights = [0.48, 0.20, 0.16, 0.10, 0.06];

  for (let i = 0; i < N; i++) {
    // Uniform random on sphere (radius 400), exclude zone near south pole
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 400;
    pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.cos(phi);
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    // Pick color by weighted random
    let roll = Math.random(), cum = 0, ci = 0;
    for (let j = 0; j < weights.length; j++) {
      cum += weights[j];
      if (roll < cum) { ci = j; break; }
      ci = j;
    }
    col[i * 3 + 0] = palette[ci][0];
    col[i * 3 + 1] = palette[ci][1];
    col[i * 3 + 2] = palette[ci][2];

    // Vary star brightness (size proxy)
    sizes[i] = 0.8 + Math.random() * Math.random() * 1.8; // most small, few bright
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos,   3));
  geo.setAttribute("color",    new THREE.BufferAttribute(col,   3));
  geo.setAttribute("size",     new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size:            1.8,
    sizeAttenuation: false,
    vertexColors:    true,
    transparent:     true,
    opacity:         0,
    blending:        THREE.AdditiveBlending,
    depthWrite:      false,
    depthTest:       false,
  });

  return new THREE.Points(geo, mat);
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface CelestialsSystem {
  sunSprite:  THREE.Sprite;
  moonSprite: THREE.Sprite;
  stars:      THREE.Points;
}

const _sunDir  = new THREE.Vector3();
const _moonDir = new THREE.Vector3();

export function createCelestials(scene: THREE.Scene): CelestialsSystem {
  const sunMat = new THREE.SpriteMaterial({
    map:         makeSunTex(),
    transparent: true,
    opacity:     0,
    blending:    THREE.AdditiveBlending,
    depthWrite:  false,
    depthTest:   false,
    fog:         false,
  });
  const sunSprite = new THREE.Sprite(sunMat);
  sunSprite.scale.set(22, 22, 1);
  scene.add(sunSprite);

  const moonMat = new THREE.SpriteMaterial({
    map:         makeMoonTex(),
    transparent: true,
    opacity:     0,
    blending:    THREE.AdditiveBlending,
    depthWrite:  false,
    depthTest:   false,
    fog:         false,
  });
  const moonSprite = new THREE.Sprite(moonMat);
  moonSprite.scale.set(12, 12, 1);
  scene.add(moonSprite);

  const stars = makeStarField();
  scene.add(stars);

  return { sunSprite, moonSprite, stars };
}

export function updateCelestials(sys: CelestialsSystem, t: number): void {
  const phase = getPHTPhase();

  // Sun
  const sunElevNorm = computeSunDir(phase, _sunDir);
  sys.sunSprite.position.copy(_sunDir).multiplyScalar(280);
  const sunOp = Math.min(1, sunElevNorm * 5) * 0.92;
  (sys.sunSprite.material as THREE.SpriteMaterial).opacity = sunOp;

  // Moon — simplified full-moon model: offset half a day from the sun
  const moonPhase    = (phase + 0.5) % 1.0;
  const moonElevNorm = computeSunDir(moonPhase, _moonDir);
  sys.moonSprite.position.copy(_moonDir).multiplyScalar(280);
  // Fade when sun is up (daytime moon is dim)
  const moonOp = moonElevNorm * Math.max(0, 1 - sunElevNorm * 4) * 0.88;
  (sys.moonSprite.material as THREE.SpriteMaterial).opacity = Math.max(0, moonOp);

  // Stars — fade out as sun rises, fade in as sun sets
  const starOp = Math.max(0, 1 - sunElevNorm * 9);
  (sys.stars.material as THREE.PointsMaterial).opacity = starOp;

  // Slow sidereal rotation: full rotation in ~86164 s (one sidereal day)
  sys.stars.rotation.y = t * (Math.PI * 2 / 86164);
}

export function disposeCelestials(sys: CelestialsSystem): void {
  const sunMat  = sys.sunSprite.material  as THREE.SpriteMaterial;
  const moonMat = sys.moonSprite.material as THREE.SpriteMaterial;
  sunMat.map?.dispose();  sunMat.dispose();  sys.sunSprite.removeFromParent();
  moonMat.map?.dispose(); moonMat.dispose(); sys.moonSprite.removeFromParent();
  (sys.stars.material as THREE.PointsMaterial).dispose();
  sys.stars.geometry.dispose();
  sys.stars.removeFromParent();
}
