import * as THREE from "three";

function getPHTHour(): number {
  const now = new Date();
  return (now.getUTCHours() + 8) % 24;
}

function makeGlowTex(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0.0, "rgba(190,255,70,1.0)");
  g.addColorStop(0.3, "rgba(150,240,40,0.75)");
  g.addColorStop(0.7, "rgba(100,200,20,0.25)");
  g.addColorStop(1.0, "rgba(80,180,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

let _tex: THREE.CanvasTexture | null = null;

export interface FireflyData {
  sprite: THREE.Sprite;
  baseX: number; baseY: number; baseZ: number;
  vx: number; vz: number;
  phase: number; freq: number;
}

const AREAS = [
  { x: -8,  z: 15, r: 8 },
  { x:  5,  z: 22, r: 6 },
  { x: -14, z: 30, r: 7 },
  { x:  8,  z: 35, r: 5 },
  { x: -5,  z:  8, r: 5 },
];
const COUNT = 38;

export function createFireflies(scene: THREE.Scene): FireflyData[] {
  if (!_tex) _tex = makeGlowTex();
  const flies: FireflyData[] = [];

  for (let i = 0; i < COUNT; i++) {
    const area = AREAS[i % AREAS.length];
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * area.r;
    const x = area.x + Math.cos(a) * r;
    const z = area.z + Math.sin(a) * r;
    const y = 0.3 + Math.random() * 1.8;

    const mat = new THREE.SpriteMaterial({
      map: _tex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(mat);
    const sc = 0.18 + Math.random() * 0.12;
    sprite.scale.set(sc, sc, 1);
    sprite.position.set(x, y, z);
    scene.add(sprite);

    flies.push({
      sprite,
      baseX: x, baseY: y, baseZ: z,
      vx: (Math.random() - 0.5) * 0.25,
      vz: (Math.random() - 0.5) * 0.25,
      phase: Math.random() * Math.PI * 2,
      freq:  1.5 + Math.random() * 2.5,
    });
  }

  return flies;
}

export function updateFireflies(flies: FireflyData[], t: number, delta: number): void {
  const hour = getPHTHour();
  const dayActive = hour >= 18 && hour < 21; // dusk to early night

  for (const f of flies) {
    const mat = f.sprite.material as THREE.SpriteMaterial;

    // Smooth global fade in / out
    const targetBase = dayActive ? 1.0 : 0.0;
    const currentBase = mat.opacity / Math.max(0.001,
      0.5 + 0.5 * Math.abs(Math.sin(t * f.freq + f.phase)));
    const smoothed = currentBase + (targetBase - currentBase) * 0.015;

    // Per-firefly flicker multiplied on top of smooth fade
    const flicker = 0.5 + 0.5 * Math.sin(t * f.freq + f.phase);
    mat.opacity = Math.max(0, Math.min(1, smoothed * flicker));

    if (smoothed < 0.02) continue;

    // Drift
    f.sprite.position.x += f.vx * delta;
    f.sprite.position.z += f.vz * delta;
    f.sprite.position.y  = f.baseY + Math.sin(t * 0.6 + f.phase) * 0.3;

    // Random direction nudge with damping
    f.vx += (Math.random() - 0.5) * 0.03;
    f.vz += (Math.random() - 0.5) * 0.03;
    f.vx *= 0.97;
    f.vz *= 0.97;

    // Leash — pull back if drifted too far from home
    const dx = f.sprite.position.x - f.baseX;
    const dz = f.sprite.position.z - f.baseZ;
    if (dx * dx + dz * dz > 16) {
      f.vx -= dx * 0.01;
      f.vz -= dz * 0.01;
    }
  }
}

export function disposeFireflies(flies: FireflyData[]): void {
  for (const f of flies) {
    (f.sprite.material as THREE.SpriteMaterial).dispose();
    f.sprite.removeFromParent();
  }
  _tex?.dispose();
  _tex = null;
}
