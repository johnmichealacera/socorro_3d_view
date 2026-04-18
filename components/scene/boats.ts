/**
 * Socorro Port — boats and vessels floating in the bay.
 * Port world position: [26, 0, 4].  Bay water lies to the east (+X).
 * All boats are placed at y ≈ 0 (water surface) just off the pier.
 *
 * Vessel types:
 *  • Filipino bangka  — narrow outrigger fishing boat with split-bamboo ama
 *  • Motorboat        — open-deck fibreglass day-cruiser
 *  • Sailing yacht    — keeled sloop with mainsail + jib
 */
import * as THREE from "three";

// ─── Shared materials ─────────────────────────────────────────────────────────

function mat(
  color: number,
  roughness: number,
  metalness = 0,
  extra: Partial<THREE.MeshStandardMaterialParameters> = {}
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
}

const M = {
  hullBlue:    mat(0x1a4a8a, 0.70, 0.15),
  hullRed:     mat(0x8a2020, 0.72, 0.12),
  hullGreen:   mat(0x28603a, 0.72, 0.12),
  hullWhite:   mat(0xf0ede8, 0.55, 0.20),
  hullYellow:  mat(0xd4a020, 0.68, 0.10),
  deck:        mat(0xc8b890, 0.90),
  cabin:       mat(0xf0ede8, 0.65, 0.10),
  mast:        mat(0xa0906a, 0.85),
  sail:        mat(0xf8f4ec, 0.92, 0, { side: THREE.DoubleSide }),
  outrigger:   mat(0x7a6040, 0.90),
  glass:       mat(0x3a6898, 0.08, 0.85, { transparent: true, opacity: 0.72 }),
  metal:       mat(0x707880, 0.40, 0.80),
  rope:        mat(0xc0a870, 0.95),
  fender:      mat(0x101010, 0.92),
};

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function box(
  w: number, h: number, d: number,
  material: THREE.Material
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cyl(
  rTop: number, rBot: number,
  h: number, segs: number,
  material: THREE.Material
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, segs), material);
  m.castShadow = true;
  return m;
}

function triangleMesh(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  cx: number, cy: number, cz: number,
  material: THREE.Material
): THREE.Mesh {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute([
    ax, ay, az,
    bx, by, bz,
    cx, cy, cz,
  ], 3));
  geo.setIndex([0, 2, 1, 0, 1, 2]); // double-sided winding
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  return m;
}

// ─── Filipino bangka (outrigger fishing boat) ─────────────────────────────────

function buildBangka(hullMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();

  // Main hull body
  const hull = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.28, 2.6), hullMat);
  hull.castShadow = true;
  hull.receiveShadow = true;
  hull.position.y = 0.14;
  g.add(hull);

  // Bow taper
  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.52, 4), hullMat);
  bow.castShadow = true;
  bow.rotation.x = Math.PI / 2;
  bow.position.set(0, 0.14, -1.56);
  g.add(bow);

  // Stern taper (shorter)
  const stern = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.36, 4), hullMat);
  stern.castShadow = true;
  stern.rotation.x = -Math.PI / 2;
  stern.position.set(0, 0.14, 1.48);
  g.add(stern);

  // Deck planks
  const deck = box(0.48, 0.04, 2.3, M.deck);
  deck.position.set(0, 0.30, 0);
  g.add(deck);

  // Outrigger poles (two per side)
  for (const side of [-1, 1]) {
    for (const pz of [-0.65, 0.45]) {
      const pole = cyl(0.022, 0.022, 1.3, 6, M.outrigger);
      pole.rotation.z = Math.PI / 2;
      pole.position.set(side * 0.65, 0.26, pz);
      g.add(pole);
    }

    // Ama (float)
    const ama = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.7, 8), M.outrigger);
    ama.castShadow = true;
    ama.rotation.x = Math.PI / 2;
    ama.position.set(side * 1.3, 0.08, -0.1);
    g.add(ama);
  }

  // Bamboo mast
  const mast = cyl(0.020, 0.026, 2.0, 6, M.mast);
  mast.position.set(0, 1.32, -0.28);
  g.add(mast);

  // Sail (triangle)
  const sail = triangleMesh(
    0,   0,    0,
    0.85, 0,   0,
    0,   1.55, 0,
    M.sail
  );
  sail.position.set(-0.04, 0.32, -0.28);
  g.add(sail);

  // Fenders (rubber bumpers along hull sides)
  for (const [side, fz] of [[-0.26, -0.8], [-0.26, 0.3], [0.26, -0.8], [0.26, 0.3]]) {
    const fender = cyl(0.028, 0.028, 0.22, 6, M.fender);
    fender.rotation.x = Math.PI / 2;
    fender.position.set(side as number, 0.18, fz as number);
    g.add(fender);
  }

  return g;
}

// ─── Small open motorboat ──────────────────────────────────────────────────────

function buildMotorboat(hullMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();

  // Hull
  const hull = box(0.85, 0.32, 2.0, hullMat);
  hull.position.y = 0.16;
  g.add(hull);

  // Bow
  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.40, 0.48, 4), hullMat);
  bow.castShadow = true;
  bow.rotation.x = Math.PI / 2;
  bow.position.set(0, 0.16, -1.24);
  g.add(bow);

  // Deck
  const deck = box(0.78, 0.04, 1.75, M.deck);
  deck.position.set(0, 0.34, 0.1);
  g.add(deck);

  // Windscreen
  const screen = box(0.72, 0.25, 0.04, M.glass);
  screen.position.set(0, 0.50, -0.50);
  g.add(screen);

  // Console
  const console_ = box(0.62, 0.22, 0.48, M.cabin);
  console_.position.set(0, 0.48, -0.22);
  g.add(console_);

  // Steering wheel (ring + hub)
  const wheel = cyl(0.12, 0.12, 0.012, 12, M.metal);
  wheel.rotation.x = Math.PI / 3;
  wheel.position.set(0, 0.65, -0.35);
  g.add(wheel);

  // Engine cowling at stern
  const engine = box(0.52, 0.18, 0.32, M.metal);
  engine.position.set(0, 0.45, 0.84);
  g.add(engine);

  // Mooring cleats (port and starboard)
  for (const sx of [-0.36, 0.36]) {
    const cleat = box(0.065, 0.055, 0.11, M.metal);
    cleat.position.set(sx, 0.37, -0.80);
    g.add(cleat);
  }

  // Navigation light (red port, green starboard)
  const pLight = box(0.04, 0.06, 0.04, mat(0xee1111, 0.5));
  pLight.position.set(-0.43, 0.40, -0.95);
  g.add(pLight);
  const sLight = box(0.04, 0.06, 0.04, mat(0x11bb33, 0.5));
  sLight.position.set(0.43, 0.40, -0.95);
  g.add(sLight);

  return g;
}

// ─── Sailing yacht (sloop) ────────────────────────────────────────────────────

function buildYacht(): THREE.Group {
  const g = new THREE.Group();

  // Hull
  const hull = box(1.05, 0.48, 3.8, M.hullWhite);
  hull.position.y = 0.24;
  g.add(hull);

  // Bow
  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.50, 0.78, 4), M.hullWhite);
  bow.castShadow = true;
  bow.rotation.x = Math.PI / 2;
  bow.position.set(0, 0.24, -2.29);
  g.add(bow);

  // Keel (fin below waterline)
  const keel = box(0.20, 0.28, 2.2, M.metal);
  keel.position.set(0, -0.14, 0);
  g.add(keel);

  // Deck
  const deck = box(0.98, 0.05, 3.45, M.deck);
  deck.position.set(0, 0.50, 0.1);
  g.add(deck);

  // Cockpit well
  const cockpit = box(0.68, 0.16, 0.85, M.cabin);
  cockpit.position.set(0, 0.58, 1.15);
  g.add(cockpit);

  // Cabin house
  const cabin = box(0.84, 0.36, 1.75, M.cabin);
  cabin.position.set(0, 0.73, -0.28);
  g.add(cabin);

  // Cabin roof with slight camber (simulated)
  const cabinRoof = box(0.88, 0.06, 1.80, mat(0xe0ddd8, 0.60));
  cabinRoof.position.set(0, 0.94, -0.28);
  g.add(cabinRoof);

  // Porthole windows
  for (const [wx, wz] of [[-0.43, -0.55], [0.43, -0.55], [-0.43, 0.08], [0.43, 0.08]]) {
    const win = box(0.01, 0.14, 0.34, M.glass);
    win.position.set(wx as number, 0.79, wz as number);
    g.add(win);
  }

  // Mast (aluminium spar)
  const mast = cyl(0.026, 0.036, 5.2, 8, M.metal);
  mast.position.set(0, 3.57, -0.12);
  g.add(mast);

  // Boom
  const boom = cyl(0.016, 0.020, 2.1, 6, M.mast);
  boom.rotation.z = Math.PI / 2;
  boom.position.set(0.75, 0.72, -0.12);
  g.add(boom);

  // Mainsail (large triangle, luffing slightly)
  const main = triangleMesh(
    0, 0,  0,
    0, 4.4, 0,
    0, 0,  2.2,
    M.sail
  );
  main.position.set(0.02, 0.53, -0.12);
  g.add(main);

  // Jib / headsail
  const jib = triangleMesh(
    0,  0.5,  0,
    0,  3.8,  0,
    0,  0.5, -2.0,
    M.sail
  );
  jib.position.set(-0.02, 0.53, -2.1);
  g.add(jib);

  // Anchor chain (small cylinder)
  const chain = cyl(0.018, 0.018, 0.45, 6, M.metal);
  chain.rotation.x = Math.PI / 2;
  chain.position.set(0, 0.52, -2.6);
  g.add(chain);

  // Fenders
  for (const [sx, fz] of [[-0.53, -0.6], [-0.53, 0.5], [0.53, -0.6], [0.53, 0.5]]) {
    const fender = cyl(0.035, 0.035, 0.28, 6, M.fender);
    fender.rotation.x = Math.PI / 2;
    fender.position.set(sx as number, 0.20, fz as number);
    g.add(fender);
  }

  return g;
}

// ─── Boat bob animation data ──────────────────────────────────────────────────

export interface BoatData {
  mesh: THREE.Group;
  baseY: number;
  phase: number;
  bobSpeed: number;
  bobAmp: number;
  rollAmp: number;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Spawns all port vessels and adds them to the scene.
 * Call once during scene initialisation (after terrain + water are created).
 */
export function createBoats(scene: THREE.Scene): BoatData[] {
  const configs: {
    builder: () => THREE.Group;
    x: number; z: number; rotY: number;
  }[] = [
    // ── Bangkas moored alongside the pier ──────────────────────────────────
    { builder: () => buildBangka(M.hullBlue),   x: 27.8, z:  6.4, rotY:  0.12 },
    { builder: () => buildBangka(M.hullRed),    x: 28.6, z:  8.8, rotY: -0.08 },
    { builder: () => buildBangka(M.hullGreen),  x: 27.2, z:  3.8, rotY:  0.05 },
    { builder: () => buildBangka(M.hullYellow), x: 29.0, z: 10.5, rotY:  0.22 },

    // ── Motorboats ─────────────────────────────────────────────────────────
    { builder: () => buildMotorboat(M.hullBlue), x: 30.2, z: 2.8, rotY:  0.45 },
    { builder: () => buildMotorboat(M.hullRed),  x: 31.0, z: 7.2, rotY: -0.30 },

    // ── Yacht anchored offshore ────────────────────────────────────────────
    { builder: () => buildYacht(), x: 33.5, z: 1.8, rotY:  0.65 },
  ];

  const boats: BoatData[] = [];

  for (const cfg of configs) {
    const mesh = cfg.builder();
    mesh.position.set(cfg.x, 0, cfg.z);
    mesh.rotation.y = cfg.rotY;
    scene.add(mesh);

    boats.push({
      mesh,
      baseY: 0,
      phase:    Math.random() * Math.PI * 2,
      bobSpeed: 0.40 + Math.random() * 0.30,
      bobAmp:   0.04 + Math.random() * 0.03,
      rollAmp:  0.012 + Math.random() * 0.010,
    });
  }

  return boats;
}

/** Call every frame to animate gentle wave bobbing. */
export function updateBoats(boats: BoatData[], t: number): void {
  for (const b of boats) {
    const wave  = Math.sin(t * b.bobSpeed + b.phase);
    const wave2 = Math.sin(t * b.bobSpeed * 0.7 + b.phase + 1.3);
    b.mesh.position.y = b.baseY + wave * b.bobAmp;
    b.mesh.rotation.x = wave  * b.rollAmp;
    b.mesh.rotation.z = wave2 * b.rollAmp * 0.7;
  }
}

/** Call on component unmount — the scene.remove loop is handled by Three.js disposal. */
export function disposeBoats(boats: BoatData[]): void {
  boats.length = 0;
}
