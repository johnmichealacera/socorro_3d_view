import * as THREE from "three";

export interface CloudSprite {
  sprite: THREE.Sprite;
  baseY: number;
  phase: number;
  speed: number;
}

function makeCloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width  = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  // Overlapping radial blobs → fluffy cloud silhouette
  const blobs = [
    { cx: 0.50, cy: 0.52, r: 0.38 },
    { cx: 0.30, cy: 0.58, r: 0.28 },
    { cx: 0.70, cy: 0.56, r: 0.27 },
    { cx: 0.47, cy: 0.38, r: 0.22 },
    { cx: 0.64, cy: 0.40, r: 0.19 },
  ];
  for (const b of blobs) {
    const grd = ctx.createRadialGradient(
      b.cx * 256, b.cy * 128, 0,
      b.cx * 256, b.cy * 128, b.r * 256
    );
    grd.addColorStop(0.00, "rgba(255,255,255,0.92)");
    grd.addColorStop(0.40, "rgba(245,250,255,0.55)");
    grd.addColorStop(1.00, "rgba(240,248,255,0.00)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 256, 128);
  }

  return new THREE.CanvasTexture(canvas);
}

let _tex: THREE.CanvasTexture | null = null;
function sharedTex(): THREE.CanvasTexture {
  if (!_tex) _tex = makeCloudTexture();
  return _tex;
}

// [x, y, z, scaleW, scaleH, opacity, speed, phase]
const DEFS: [number, number, number, number, number, number, number, number][] = [
  [  20,  26, -30, 36, 14, 0.55, 0.50, 0.0 ],
  [ -10,  22, -10, 28, 11, 0.45, 0.35, 1.2 ],
  [  48,  28,  14, 32, 13, 0.40, 0.65, 2.4 ],
  [   5,  20,  22, 24, 10, 0.50, 0.45, 0.8 ],
  [ -38,  25, -24, 30, 12, 0.35, 0.30, 3.1 ],
  [  68,  30,  -8, 40, 16, 0.60, 0.55, 1.7 ],
  [ -58,  24,   6, 22,  9, 0.42, 0.40, 2.0 ],
  [  32,  23,  44, 26, 10, 0.38, 0.60, 0.4 ],
];

export function createClouds(scene: THREE.Scene): CloudSprite[] {
  const tex    = sharedTex();
  const clouds: CloudSprite[] = [];

  for (const [x, y, z, sw, sh, op, spd, ph] of DEFS) {
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: op,
      depthWrite: false,
      fog: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(sw, sh, 1);
    sprite.position.set(x, y, z);
    scene.add(sprite);
    clouds.push({ sprite, baseY: y, phase: ph, speed: spd });
  }

  return clouds;
}

export function updateClouds(clouds: CloudSprite[], t: number, delta: number): void {
  for (const c of clouds) {
    c.sprite.position.x -= c.speed * delta;
    if (c.sprite.position.x < -88) c.sprite.position.x = 88;
    c.sprite.position.y = c.baseY + Math.sin(t * 0.28 + c.phase) * 0.6;
  }
}

export function disposeClouds(clouds: CloudSprite[]): void {
  for (const c of clouds) {
    (c.sprite.material as THREE.SpriteMaterial).dispose();
    c.sprite.removeFromParent();
  }
  _tex?.dispose();
  _tex = null;
}
