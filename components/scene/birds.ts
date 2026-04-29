import * as THREE from "three";

export interface BirdData {
  sprite:      THREE.Sprite;
  mode:        "circle" | "glide";
  // circle
  cx: number; cz: number; radius: number;
  angle: number; angleSpeed: number;
  // glide
  glideSpeed: number; glideDir: number;
  // shared
  altitude:    number;
  phase:       number;
  baseScale:   number;
  baseOpacity: number;  // opacity at full schedule intensity
}

function makeBirdTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width  = 64;
  canvas.height = 32;
  const ctx = canvas.getContext("2d")!;

  // Simple seagull silhouette — two arched wings + tiny body
  ctx.fillStyle = "rgba(28,36,48,0.88)";
  ctx.beginPath();
  ctx.moveTo(32, 17);
  ctx.quadraticCurveTo(20,  8,  3, 11);
  ctx.quadraticCurveTo(14, 15, 32, 17);
  ctx.moveTo(32, 17);
  ctx.quadraticCurveTo(44,  8, 61, 11);
  ctx.quadraticCurveTo(50, 15, 32, 17);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(32, 17, 2.2, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

let _tex: THREE.CanvasTexture | null = null;

export function createBirds(scene: THREE.Scene): BirdData[] {
  if (!_tex) _tex = makeBirdTexture();

  const birds: BirdData[] = [];

  // Circling birds over the bay
  const circleDefs = [
    { cx: 32, cz:  4, r: 10, alt: 10, phase: 0.0, as: 0.55 },
    { cx: 28, cz:  8, r:  7, alt:  8, phase: 1.5, as: 0.45 },
    { cx: 35, cz:  0, r: 14, alt: 13, phase: 2.8, as: 0.35 },
    { cx: 30, cz:  2, r:  8, alt:  7, phase: 0.9, as: 0.62 },
    { cx: 26, cz: 12, r: 12, alt: 11, phase: 3.5, as: 0.42 },
  ];

  for (const d of circleDefs) {
    const mat = new THREE.SpriteMaterial({
      map: _tex, transparent: true, opacity: 0.85, depthWrite: false, fog: false,
    });
    const sprite = new THREE.Sprite(mat);
    const sc = 0.45 + Math.random() * 0.22;
    sprite.scale.set(sc * 2, sc, 1);
    sprite.position.set(d.cx + d.r, d.alt, d.cz);
    scene.add(sprite);
    birds.push({
      sprite, mode: "circle",
      cx: d.cx, cz: d.cz, radius: d.r,
      angle: d.phase, angleSpeed: d.as,
      glideSpeed: 0, glideDir: 1,
      altitude: d.alt, phase: d.phase, baseScale: sc, baseOpacity: 0.85,
    });
  }

  // Gliding birds along the shore
  const glideDefs = [
    { sx: 20, z:  0, alt: 5, spd: 3.5, dir:  1, phase: 0.3 },
    { sx: -5, z: -5, alt: 6, spd: 2.8, dir: -1, phase: 1.8 },
    { sx: 15, z: 10, alt: 4, spd: 4.0, dir:  1, phase: 0.7 },
  ];

  for (const d of glideDefs) {
    const mat = new THREE.SpriteMaterial({
      map: _tex, transparent: true, opacity: 0.80, depthWrite: false, fog: false,
    });
    const sprite = new THREE.Sprite(mat);
    const sc = 0.35 + Math.random() * 0.18;
    sprite.scale.set(sc * 2, sc, 1);
    sprite.position.set(d.sx, d.alt, d.z);
    scene.add(sprite);
    birds.push({
      sprite, mode: "glide",
      cx: 0, cz: 0, radius: 0, angle: 0, angleSpeed: 0,
      glideSpeed: d.spd, glideDir: d.dir,
      altitude: d.alt, phase: d.phase, baseScale: sc, baseOpacity: 0.80,
    });
  }

  return birds;
}

// ── PHT schedule ──────────────────────────────────────────────────────────────
// Birds are active during daylight hours only (PHT).

function birdScheduleTarget(): number {
  const now  = new Date();
  const phtH = (now.getUTCHours() + 8) % 24;
  const phtM = now.getUTCMinutes();
  const hm   = phtH + phtM / 60;

  if (hm < 5.5  || hm >= 20.0) return 0;            // night — birds are roosting
  if (hm >= 5.5  && hm <  6.5) return hm - 5.5;     // dawn ramp-in
  if (hm >= 19.0 && hm < 20.0) return 1.0 - (hm - 19.0); // dusk ramp-out
  return 1.0;
}

let _birdCheckAt   = 0;
let _birdIntensity = birdScheduleTarget(); // initialize to real PHT, not 1.0

export function updateBirds(birds: BirdData[], t: number, delta: number): void {
  if (t - _birdCheckAt > 2.0) {
    _birdCheckAt = t;
    const target = birdScheduleTarget();
    _birdIntensity += (target - _birdIntensity) * 0.05; // smooth transition
  }

  const iv = _birdIntensity;

  for (const b of birds) {
    const mat = b.sprite.material as THREE.SpriteMaterial;

    // Hide completely when scheduled off
    b.sprite.visible = iv > 0.02;
    if (!b.sprite.visible) continue;

    if (b.mode === "circle") {
      b.angle += b.angleSpeed * delta;
      b.sprite.position.x = b.cx + Math.cos(b.angle) * b.radius;
      b.sprite.position.z = b.cz + Math.sin(b.angle) * b.radius;
      b.sprite.position.y = b.altitude + Math.sin(t * 0.8 + b.phase) * 0.6;
    } else {
      b.sprite.position.x += b.glideDir * b.glideSpeed * delta;
      if (b.sprite.position.x >  42) b.glideDir = -1;
      if (b.sprite.position.x < -12) b.glideDir =  1;
      b.sprite.position.y = b.altitude + Math.sin(t * 0.6 + b.phase) * 0.4;
    }

    // Wingbeat: oscillate horizontal scale
    const beat = 0.72 + Math.abs(Math.sin(t * 3.5 + b.phase)) * 0.50;
    b.sprite.scale.set(b.baseScale * 2 * beat, b.baseScale, 1);
    mat.opacity = b.baseOpacity * iv;
  }
}

export function disposeBirds(birds: BirdData[]): void {
  for (const b of birds) {
    (b.sprite.material as THREE.SpriteMaterial).dispose();
    b.sprite.removeFromParent();
  }
  _tex?.dispose();
  _tex = null;
}
