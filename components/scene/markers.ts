/**
 * Realistic PBR buildings for the Socorro 3D map.
 * Each structure uses MeshStandardMaterial with proper roughness/metalness.
 * Architecture references Filipino coastal-town vernacular.
 */
import * as THREE from "three";
import { LocationData, BuildingGroup } from "./types";
import { getTerrainHeight } from "./terrain";

// ─── Shared Materials ─────────────────────────────────────────────────────────

function mat(
  color: number,
  roughness: number,
  metalness = 0,
  opts: Partial<THREE.MeshStandardMaterialParameters> = {}
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, ...opts });
}

const M = {
  concrete:     mat(0xc8c0b4, 0.90),
  concreteDark: mat(0xa09888, 0.88),
  concreteCream:mat(0xe8e0d0, 0.88),
  concreteWhite:mat(0xf2ece4, 0.85),
  plasterCream: mat(0xf0e4d0, 0.92),
  roofConcrete: mat(0xb0a898, 0.82),
  metalRoof:    mat(0x607060, 0.45, 0.65),
  metalRoofRust:mat(0x8a5038, 0.50, 0.60),
  metalRoofGreen:mat(0x4a6840, 0.48, 0.62),
  metalRoofRed: mat(0x7a3828, 0.50, 0.60),
  glass:        mat(0x3a6898, 0.08, 0.85, { transparent: true, opacity: 0.72,
                    emissive: new THREE.Color(0xf0f8ff), emissiveIntensity: 0 }),
  glassDark:    mat(0x1a3060, 0.06, 0.90, { transparent: true, opacity: 0.60,
                    emissive: new THREE.Color(0xe8f4ff), emissiveIntensity: 0 }),
  woodBeam:     mat(0x6e4830, 0.95),
  concreteGray: mat(0x909090, 0.86),
  asphalt:      mat(0x484848, 0.95),
  steel:        mat(0x707880, 0.40, 0.80),
  stone:        mat(0xc0b8a8, 0.93),
  terraCotta:   mat(0xa85838, 0.75, 0.05),
  goldCross:    mat(0xd4a840, 0.30, 0.60),
  flagPole:     mat(0xc8c8c8, 0.35, 0.70),
  roofTile:     mat(0x905030, 0.82, 0.02),
  pier:         mat(0x808878, 0.88),
  rust:         mat(0x7a4828, 0.72, 0.40),
  corrugated:   mat(0x8a9080, 0.40, 0.70),
};

// ─── Geometry Helpers ─────────────────────────────────────────────────────────

function box(
  w: number, h: number, d: number,
  material: THREE.MeshStandardMaterial,
  castShadow = true
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.castShadow = castShadow;
  m.receiveShadow = true;
  return m;
}

function cyl(
  rTop: number, rBot: number, h: number,
  segs: number,
  material: THREE.MeshStandardMaterial
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, segs), material);
  m.castShadow = true;
  return m;
}

function cone(
  r: number, h: number, segs: number,
  material: THREE.MeshStandardMaterial
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, segs), material);
  m.castShadow = true;
  return m;
}

function addTo(parent: THREE.Object3D, child: THREE.Object3D, x=0, y=0, z=0): THREE.Object3D {
  child.position.set(x, y, z);
  parent.add(child);
  return child;
}

function flagPole(height = 2.2, flagColor = 0x0038a8): THREE.Group {
  const g = new THREE.Group();
  const pole = cyl(0.025, 0.03, height, 6, M.flagPole);
  pole.position.y = height / 2;
  g.add(pole);
  const flag = box(0.35, 0.22, 0.005, mat(flagColor, 0.9, 0, { side: THREE.DoubleSide }));
  flag.position.set(0.175, height - 0.11, 0);
  g.add(flag);
  // White stripe
  const stripe = box(0.35, 0.06, 0.006, mat(0xffffff, 0.9, 0, { side: THREE.DoubleSide }));
  stripe.position.set(0.175, height - 0.11, 0.001);
  g.add(stripe);
  return g;
}

function windowRow(
  count: number, w: number, h: number, spacing: number,
  startX: number, y: number, z: number
): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const win = box(w, h, 0.02, M.glass, false);
    win.position.set(startX + i * spacing, y, z);
    g.add(win);
  }
  return g;
}

function verandah(w: number, d: number, y: number, floorCount: number): THREE.Group {
  const g = new THREE.Group();
  for (let f = 0; f < floorCount; f++) {
    // Roof/slab
    const slab = box(w, 0.06, d, M.concreteGray);
    slab.position.y = y + f * 1.0;
    g.add(slab);
    // Posts every 1.5m
    const posts = Math.round(w / 1.5) + 1;
    for (let p = 0; p <= posts; p++) {
      const post = cyl(0.045, 0.05, 0.9, 6, M.concrete);
      post.position.set(-w / 2 + p * (w / posts), y + f * 1.0 - 0.47, 0);
      g.add(post);
    }
  }
  return g;
}

// ─── Building Builders ────────────────────────────────────────────────────────

/** Municipal Hall – 2-story colonial Philippine government building */
function buildMunicipalHall(): THREE.Group {
  const g = new THREE.Group();

  // Ground floor body
  const gf = box(2.8, 0.95, 1.6, M.concreteCream);
  gf.position.y = 0.475;
  g.add(gf);

  // Second floor
  const sf = box(2.6, 0.92, 1.45, M.concreteWhite);
  sf.position.y = 1.42;
  g.add(sf);

  // Flat roof with parapet
  const roof = box(2.85, 0.12, 1.65, M.roofConcrete);
  roof.position.y = 1.94;
  g.add(roof);

  // Front entrance porch
  const porch = box(1.1, 0.08, 0.55, M.concreteDark);
  porch.position.set(0, 0.04, 0.88);
  g.add(porch);

  // Entrance steps
  for (let s = 0; s < 3; s++) {
    const step = box(0.9, 0.08, 0.2, M.stone);
    step.position.set(0, s * 0.08, 0.78 + s * 0.1);
    g.add(step);
  }

  // Porch roof/awning
  const awning = box(1.3, 0.07, 0.65, M.roofConcrete);
  awning.position.set(0, 1.0, 0.9);
  g.add(awning);

  // Porch columns (4)
  for (const xc of [-0.38, 0.38]) {
    for (const zc of [0.68, 1.08]) {
      const col = cyl(0.055, 0.065, 0.88, 10, M.concreteWhite);
      col.position.set(xc, 0.52, zc);
      g.add(col);
    }
  }

  // Ground floor windows (front)
  g.add(Object.assign(windowRow(3, 0.22, 0.35, 0.75, -0.75, 0.5, 0.81), {}));
  // Second floor windows (front)
  g.add(Object.assign(windowRow(4, 0.18, 0.28, 0.62, -0.93, 1.45, 0.73), {}));
  // Side windows
  g.add(Object.assign(windowRow(2, 0.18, 0.28, 0.7, -0.35, 1.45, -0.73), {}));

  // Flag pole
  const fp = flagPole(2.6);
  fp.position.set(-0.95, 1.94, -0.3);
  g.add(fp);

  return g;
}

/** St. Joseph Parish Church – Spanish-Filipino stone church */
function buildChurch(): THREE.Group {
  const g = new THREE.Group();

  // Main nave
  const nave = box(1.8, 2.2, 3.2, M.stone);
  nave.position.y = 1.1;
  g.add(nave);

  // Nave roof (gabled)
  const ridge = new THREE.CylinderGeometry(0, 1.08, 0.9, 4, 1, false);
  ridge.rotateY(Math.PI / 4);
  const navRoof = new THREE.Mesh(ridge, M.roofTile);
  navRoof.castShadow = true;
  navRoof.position.y = 2.65;
  g.add(navRoof);

  // Bell tower (taller, on south side)
  const tower = box(0.85, 3.6, 0.85, M.plasterCream);
  tower.position.set(0.6, 1.8, -1.55);
  g.add(tower);

  // Tower belfry openings (arched — approximated with glass)
  for (const zb of [-0.43, 0.43]) {
    const arch = box(0.3, 0.45, 0.02, M.glassDark, false);
    arch.position.set(0.6, 3.3, -1.55 + zb);
    g.add(arch);
  }
  for (const xb of [0.19, 1.01]) {
    const arch = box(0.02, 0.45, 0.3, M.glassDark, false);
    arch.position.set(xb, 3.3, -1.55);
    g.add(arch);
  }

  // Tower spire
  const spire = cone(0.38, 0.75, 8, M.roofTile);
  spire.position.set(0.6, 3.98, -1.55);
  g.add(spire);

  // Cross
  const crossV = box(0.04, 0.55, 0.04, M.goldCross);
  crossV.position.set(0.6, 4.64, -1.55);
  g.add(crossV);
  const crossH = box(0.30, 0.04, 0.04, M.goldCross);
  crossH.position.set(0.6, 4.55, -1.55);
  g.add(crossH);

  // Facade (front wall detail)
  const facade = box(1.82, 0.04, 0.06, M.plasterCream);
  facade.position.set(0, 2.22, 1.63);
  g.add(facade);

  // Rose window
  for (let i = 0; i < 8; i++) {
    const spoke = box(0.28, 0.03, 0.02, M.goldCross, false);
    spoke.rotation.z = (i / 8) * Math.PI;
    spoke.position.set(0, 1.5, 1.62);
    g.add(spoke);
  }

  // Main door arch
  const door = box(0.48, 0.82, 0.04, M.glassDark, false);
  door.position.set(0, 0.41, 1.62);
  g.add(door);

  // Buttresses (each side)
  for (const xb of [-0.9, 0.9]) {
    const butt = box(0.22, 1.8, 0.3, M.stone);
    butt.position.set(xb, 0.9, 0);
    g.add(butt);
  }

  return g;
}

/** Poblacion Market – open-air palengke with corrugated roof */
function buildMarket(): THREE.Group {
  const g = new THREE.Group();

  // Concrete floor slab
  const slab = box(5.2, 0.12, 3.8, M.concreteGray);
  slab.position.y = 0.06;
  g.add(slab);

  // Steel support columns
  const cols: [number, number][] = [];
  for (let xi = 0; xi < 4; xi++) {
    for (let zi = 0; zi < 3; zi++) {
      cols.push([-1.8 + xi * 1.2, -1.2 + zi * 1.2]);
    }
  }
  for (const [cx, cz] of cols) {
    const col = box(0.10, 1.35, 0.10, M.steel);
    col.position.set(cx, 0.72, cz);
    g.add(col);
  }

  // Corrugated metal roof (red-rust)
  const roofMain = box(5.4, 0.09, 4.0, M.metalRoofRust);
  roofMain.position.y = 1.40;
  g.add(roofMain);

  // Gabled roof ends
  const gableGeo = new THREE.CylinderGeometry(0, 2.15, 0.55, 4);
  gableGeo.rotateY(Math.PI / 4);
  const gable = new THREE.Mesh(gableGeo, M.metalRoofRed);
  gable.castShadow = true;
  gable.position.y = 1.73;
  g.add(gable);

  // Stall partitions (low walls inside)
  const partitions = [
    { x: -1.0, z: 0, w: 0.06, d: 3.5 },
    { x:  1.0, z: 0, w: 0.06, d: 3.5 },
  ];
  for (const p of partitions) {
    const wall = box(p.w, 0.8, p.d, M.concreteDark);
    wall.position.set(p.x, 0.52, p.z);
    g.add(wall);
  }

  // Low perimeter walls (half-open)
  const perimW = box(5.2, 0.55, 0.10, M.concrete);
  perimW.position.set(0, 0.40, 1.90);
  g.add(perimW);
  const perimE = perimW.clone();
  perimE.position.z = -1.90;
  g.add(perimE);

  return g;
}

/** Port / Pier – concrete wharf with warehouse and crane */
function buildPort(): THREE.Group {
  const g = new THREE.Group();

  // Main pier extending toward the bay (east = +Z in local space, rotated)
  const pier = box(0.9, 0.30, 9.0, M.pier);
  pier.position.set(0, 0.15, 4.0); // extends east
  g.add(pier);

  // Cross-pier
  const crossPier = box(3.0, 0.22, 0.7, M.pier);
  crossPier.position.set(0, 0.22, 8.0);
  g.add(crossPier);

  // Mooring bollards
  for (const [bx, bz] of [[-1.2, 7], [1.2, 7], [-1.2, 5.5], [1.2, 5.5]]) {
    const bollard = cyl(0.07, 0.08, 0.35, 8, M.steel);
    bollard.position.set(bx, 0.48, bz);
    g.add(bollard);
  }

  // Terminal / warehouse building
  const warehouse = box(3.2, 1.4, 1.8, M.corrugated);
  warehouse.position.set(0, 0.84, -0.3);
  g.add(warehouse);

  // Warehouse roof
  const wRoof = box(3.4, 0.10, 2.0, M.metalRoof);
  wRoof.position.set(0, 1.59, -0.3);
  g.add(wRoof);

  // Loading crane
  const craneBase = box(0.4, 0.3, 0.4, M.steel);
  craneBase.position.set(1.0, 0.45, 1.5);
  g.add(craneBase);
  const craneMast = cyl(0.06, 0.08, 2.0, 8, M.steel);
  craneMast.position.set(1.0, 1.45, 1.5);
  g.add(craneMast);
  const craneArm = box(2.0, 0.07, 0.07, M.steel);
  craneArm.position.set(0.2, 2.5, 1.5);
  g.add(craneArm);
  const craneHook = cyl(0.03, 0.03, 0.5, 6, M.steel);
  craneHook.position.set(-0.6, 2.22, 1.5);
  g.add(craneHook);

  // Signage board
  const sign = box(1.6, 0.35, 0.05, mat(0x1a3a6e, 0.85));
  sign.position.set(0, 1.77, 0.63);
  g.add(sign);

  return g;
}

/** DepEd Elementary School – 2-story block with open verandah */
function buildElementarySchool(): THREE.Group {
  const g = new THREE.Group();

  // Main building block
  const main = box(4.8, 1.8, 1.2, M.concreteCream);
  main.position.y = 0.9;
  g.add(main);

  // Verandah roof slabs (front face, both floors)
  const ver1 = box(5.0, 0.07, 0.55, M.metalRoofGreen);
  ver1.position.set(0, 0.95, 0.87);
  g.add(ver1);
  const ver2 = box(5.0, 0.07, 0.55, M.metalRoofGreen);
  ver2.position.set(0, 1.85, 0.87);
  g.add(ver2);

  // Verandah posts (ground + 2nd floor)
  for (let i = 0; i <= 5; i++) {
    for (let f = 0; f < 2; f++) {
      const post = cyl(0.04, 0.05, 0.85, 6, M.concreteWhite);
      post.position.set(-2.4 + i * 0.96, 0.5 + f * 0.9, 0.87);
      g.add(post);
    }
  }

  // Main roof (green corrugated metal)
  const mainRoof = box(5.0, 0.09, 1.35, M.metalRoofGreen);
  mainRoof.position.set(0, 1.84, 0);
  g.add(mainRoof);

  // Classroom windows
  for (let f = 0; f < 2; f++) {
    for (let i = 0; i < 4; i++) {
      const win = box(0.55, 0.42, 0.02, M.glass, false);
      win.position.set(-1.8 + i * 1.2, 0.55 + f * 0.9, 0.61);
      g.add(win);
    }
  }

  // Flag pole
  const fp = flagPole(2.0);
  fp.position.set(-2.1, 1.84, 0.2);
  g.add(fp);

  return g;
}

/** DepEd National High School – larger L-shaped campus building */
function buildHighSchool(): THREE.Group {
  const g = new THREE.Group();

  // Main long block
  const main = box(6.4, 2.0, 1.3, M.concreteCream);
  main.position.y = 1.0;
  g.add(main);

  // Wing block (perpendicular)
  const wing = box(1.3, 2.0, 3.5, M.concreteCream);
  wing.position.set(-2.85, 1.0, 1.35);
  g.add(wing);

  // Verandah slabs – main block
  for (let f = 0; f < 2; f++) {
    const ver = box(6.6, 0.07, 0.55, M.metalRoofGreen);
    ver.position.set(0, 1.02 + f * 0.94, 0.92);
    g.add(ver);
  }

  // Verandah posts – main block
  for (let i = 0; i <= 7; i++) {
    for (let f = 0; f < 2; f++) {
      const post = cyl(0.04, 0.05, 0.88, 6, M.concreteWhite);
      post.position.set(-3.2 + i * 0.92, 0.52 + f * 0.94, 0.92);
      g.add(post);
    }
  }

  // Roofs
  const mainRoof = box(6.6, 0.09, 1.45, M.metalRoofGreen);
  mainRoof.position.set(0, 2.04, 0);
  g.add(mainRoof);
  const wingRoof = box(1.45, 0.09, 3.65, M.metalRoofGreen);
  wingRoof.position.set(-2.85, 2.04, 1.35);
  g.add(wingRoof);

  // Windows
  for (let f = 0; f < 2; f++) {
    for (let i = 0; i < 5; i++) {
      const win = box(0.6, 0.44, 0.02, M.glass, false);
      win.position.set(-2.5 + i * 1.22, 0.58 + f * 0.94, 0.66);
      g.add(win);
    }
  }

  // Flag pole
  const fp = flagPole(2.4);
  fp.position.set(-2.8, 2.04, -0.1);
  g.add(fp);

  // Gate posts
  for (const gx of [-0.5, 0.5]) {
    const gpost = box(0.15, 1.2, 0.15, M.concrete);
    gpost.position.set(gx, 0.6, 1.6);
    g.add(gpost);
  }

  return g;
}

/** Town Plaza – paved park with central gazebo, Rizal monument, flag pole */
function buildPlaza(): THREE.Group {
  const g = new THREE.Group();

  // Main paved area
  const pavement = box(6.0, 0.08, 5.0, mat(0xd0c8b8, 0.90), false);
  pavement.position.y = 0.04;
  g.add(pavement);

  // Path cross (lighter stone)
  for (const [px, pz, pw, pd] of [
    [0, 0, 0.55, 5.0], [0, 0, 6.0, 0.55],
  ] as [number, number, number, number][]) {
    const path = box(pw, 0.02, pd, mat(0xc8c0b0, 0.88), false);
    path.position.set(px, 0.09, pz);
    g.add(path);
  }

  // Central gazebo base (circular step)
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.28, 0.18, 16), mat(0xc0b8a8, 0.88));
  base.castShadow = true; base.position.y = 0.18;
  g.add(base);

  // Gazebo columns (8)
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const col = cyl(0.050, 0.060, 1.55, 8, M.concreteWhite);
    col.position.set(Math.cos(angle) * 0.88, 0.96, Math.sin(angle) * 0.88);
    g.add(col);
  }

  // Gazebo ring beam
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.055, 6, 24), M.concreteWhite);
  ring.rotation.x = Math.PI / 2; ring.position.y = 1.74;
  ring.castShadow = true;
  g.add(ring);

  // Gazebo roof (octagonal cone)
  const roofGeo = new THREE.CylinderGeometry(0, 1.12, 0.72, 8, 1, false);
  const gazeboRoof = new THREE.Mesh(roofGeo, M.metalRoofRed);
  gazeboRoof.castShadow = true; gazeboRoof.position.y = 2.10;
  g.add(gazeboRoof);

  // Rizal monument (obelisk)
  const monBase = box(0.38, 0.22, 0.38, M.stone);
  monBase.position.set(-2.2, 0.19, -1.4);
  g.add(monBase);
  const monPillar = box(0.16, 1.35, 0.16, M.stone);
  monPillar.position.set(-2.2, 0.98, -1.4);
  g.add(monPillar);
  const monFigure = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.42, 6), M.concreteDark);
  monFigure.castShadow = true; monFigure.position.set(-2.2, 1.88, -1.4);
  g.add(monFigure);

  // Benches (4 cardinal directions from gazebo)
  for (const [bx, bz, ry] of [
    [1.85, 0, 0], [-1.85, 0, 0], [0, 1.85, Math.PI / 2], [0, -1.85, Math.PI / 2],
  ] as [number, number, number][]) {
    const bench = box(0.62, 0.07, 0.22, mat(0x7a5840, 0.88));
    bench.rotation.y = ry; bench.position.set(bx, 0.28, bz);
    g.add(bench);
    for (const s of [-0.22, 0.22]) {
      const leg = box(0.06, 0.20, 0.20, mat(0x686868, 0.55, 0.25));
      leg.rotation.y = ry;
      leg.position.set(bx + Math.cos(ry) * s, 0.14, bz + Math.sin(ry) * s);
      g.add(leg);
    }
  }

  // Flag pole (north-east corner)
  const fp = flagPole(3.0);
  fp.position.set(2.3, 0.08, -1.8);
  g.add(fp);

  // Decorative lamp posts (4 corners)
  for (const [lx, lz] of [[-2.5, -2.1], [2.5, -2.1], [-2.5, 2.1], [2.5, 2.1]]) {
    const lpost = cyl(0.025, 0.035, 1.6, 6, M.flagPole);
    lpost.position.set(lx, 0.88, lz);
    g.add(lpost);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), mat(0xffe8a0, 0.45, 0.30));
    lamp.position.set(lx, 1.72, lz);
    g.add(lamp);
  }

  return g;
}

/** Rural Health Unit – 2-story public health facility with red cross */
function buildHospital(): THREE.Group {
  const g = new THREE.Group();

  // Main building body
  const main = box(3.4, 1.70, 1.40, M.concreteWhite);
  main.position.y = 0.85;
  g.add(main);

  // Side wing
  const wing = box(1.20, 1.70, 2.20, M.concreteWhite);
  wing.position.set(-1.55, 0.85, 1.10);
  g.add(wing);

  // Blue-grey roof slabs
  const blueRoof = mat(0x3a78b8, 0.55, 0.15);
  const mainRoof = box(3.60, 0.10, 1.60, blueRoof);
  mainRoof.position.y = 1.75;
  g.add(mainRoof);
  const wingRoof = box(1.40, 0.10, 2.40, blueRoof);
  wingRoof.position.set(-1.55, 1.75, 1.10);
  g.add(wingRoof);

  // Entrance canopy
  const canopy = box(1.30, 0.07, 0.55, blueRoof);
  canopy.position.set(0.20, 0.92, 0.97);
  g.add(canopy);
  for (const cx of [-0.40, 0.80]) {
    const post = cyl(0.04, 0.05, 0.88, 6, M.concreteWhite);
    post.position.set(cx, 0.50, 0.97);
    g.add(post);
  }

  // Red cross emblem on front wall
  const crossRed = mat(0xcc1122, 0.72);
  const crossV = box(0.07, 0.54, 0.04, crossRed);
  crossV.position.set(0.20, 1.10, 0.71);
  g.add(crossV);
  const crossH = box(0.42, 0.07, 0.04, crossRed);
  crossH.position.set(0.20, 1.10, 0.71);
  g.add(crossH);

  // Sign fascia
  const fascia = box(1.60, 0.28, 0.04, mat(0x1a5a9e, 0.72));
  fascia.position.set(0.20, 1.52, 0.71);
  g.add(fascia);

  // Windows (front)
  for (let i = 0; i < 2; i++) {
    const win = box(0.34, 0.38, 0.02, M.glass, false);
    win.position.set(-0.88 + i * 3.20, 0.80, 0.71);
    g.add(win);
  }
  // Windows (second floor)
  for (let i = 0; i < 3; i++) {
    const win = box(0.30, 0.34, 0.02, M.glass, false);
    win.position.set(-1.10 + i * 1.10, 1.35, 0.71);
    g.add(win);
  }

  // Entrance steps
  for (let s = 0; s < 2; s++) {
    const step = box(1.10, 0.07, 0.20, M.stone);
    step.position.set(0.20, s * 0.07, 0.80 + s * 0.10);
    g.add(step);
  }

  // Small ambulance parking apron
  const apron = box(1.8, 0.04, 1.10, mat(0x909888, 0.92), false);
  apron.position.set(1.70, 0.02, 0);
  g.add(apron);

  return g;
}

/** SOEMCO – electric cooperative admin building with utility pole */
function buildSoemco(): THREE.Group {
  const g = new THREE.Group();

  // Main office block
  const main = box(2.20, 1.50, 1.30, M.concrete);
  main.position.y = 0.75;
  g.add(main);

  // Flat roof with parapet
  const roof = box(2.40, 0.10, 1.50, M.concreteDark);
  roof.position.y = 1.55;
  g.add(roof);

  // Utility/meter room at back
  const util = box(0.90, 1.00, 0.80, M.concreteDark);
  util.position.set(-0.80, 0.50, -0.85);
  g.add(util);

  // Yellow signage fascia (SOEMCO brand color)
  const fascia = box(1.45, 0.28, 0.04, mat(0xf59e0b, 0.68));
  fascia.position.set(0, 1.32, 0.66);
  g.add(fascia);

  // Entrance door
  const door = box(0.36, 0.68, 0.04, mat(0x808888, 0.58, 0.28));
  door.position.set(0, 0.38, 0.66);
  g.add(door);

  // Windows
  for (const xw of [-0.72, 0.72]) {
    const win = box(0.30, 0.36, 0.02, M.glass, false);
    win.position.set(xw, 0.78, 0.66);
    g.add(win);
  }

  // Utility pole next to building
  const pole = cyl(0.038, 0.055, 2.30, 6, mat(0x7a6850, 0.90));
  pole.position.set(0.95, 1.18, 0.75);
  g.add(pole);
  // Cross-arm
  const arm = box(0.85, 0.04, 0.04, mat(0x7a6850, 0.90));
  arm.position.set(0.95, 2.22, 0.75);
  g.add(arm);
  // Insulators (small cylinders)
  for (const ox of [-0.35, 0.35]) {
    const ins = cyl(0.025, 0.025, 0.09, 5, mat(0x8a5838, 0.75));
    ins.position.set(0.95 + ox, 2.24, 0.75);
    g.add(ins);
  }

  return g;
}

/** Palawan Pawnshop – small commercial shopfront in teal/blue-green branding */
function buildPalawanPawnshop(): THREE.Group {
  const g = new THREE.Group();

  // Building body (Palawan teal)
  const main = box(1.40, 1.20, 1.00, mat(0x0d7a8a, 0.72));
  main.position.y = 0.60;
  g.add(main);

  // Roof
  const roof = box(1.50, 0.08, 1.10, mat(0x095468, 0.70, 0.12));
  roof.position.y = 1.28;
  g.add(roof);

  // Awning (lighter teal)
  const awning = box(1.52, 0.06, 0.48, mat(0x1aaabf, 0.52, 0.12));
  awning.position.set(0, 0.90, 0.74);
  g.add(awning);

  // Sign fascia (dark blue-green)
  const fascia = box(1.44, 0.32, 0.04, mat(0x006080, 0.62));
  fascia.position.set(0, 1.10, 0.52);
  g.add(fascia);

  // Roll-up entrance door
  const door = box(0.70, 0.84, 0.04, mat(0x0d9ab8, 0.52, 0.18));
  door.position.set(0, 0.44, 0.52);
  g.add(door);

  // Barred windows
  for (const xw of [-0.48, 0.48]) {
    const win = box(0.22, 0.28, 0.03, mat(0x6ed8f0, 0.22, 0.28, { transparent: true, opacity: 0.65 }), false);
    win.position.set(xw, 0.73, 0.52);
    g.add(win);
    // Bars
    for (let b = 0; b < 3; b++) {
      const bar = box(0.015, 0.28, 0.02, mat(0x444444, 0.55, 0.50));
      bar.position.set(xw - 0.07 + b * 0.07, 0.73, 0.55);
      g.add(bar);
    }
  }

  return g;
}

/** Sofeco Store – cooperative general store (green branding) */
function buildSofecoStore(): THREE.Group {
  const g = new THREE.Group();

  // Building body
  const main = box(2.00, 1.30, 1.20, mat(0xeeeae0, 0.88));
  main.position.y = 0.65;
  g.add(main);

  // Metal roof (cooperative green)
  const roof = box(2.10, 0.09, 1.30, M.metalRoofGreen);
  roof.position.y = 1.34;
  g.add(roof);

  // Sign fascia
  const fascia = box(2.00, 0.29, 0.04, mat(0x006633, 0.62));
  fascia.position.set(0, 1.18, 0.62);
  g.add(fascia);

  // Awning
  const awning = box(2.10, 0.06, 0.50, mat(0x008844, 0.52, 0.10));
  awning.position.set(0, 0.96, 0.87);
  g.add(awning);

  // Double doors
  for (const xd of [-0.24, 0.24]) {
    const door = box(0.34, 0.80, 0.04, mat(0x4a6840, 0.68, 0.08));
    door.position.set(xd, 0.43, 0.62);
    g.add(door);
  }

  // Windows
  for (const xw of [-0.76, 0.76]) {
    const win = box(0.34, 0.42, 0.02, M.glass, false);
    win.position.set(xw, 0.73, 0.62);
    g.add(win);
  }

  return g;
}

/** Sofeco Hardware – warehouse-style hardware store (dark green fascia) */
function buildSofecoHardware(): THREE.Group {
  const g = new THREE.Group();

  // Building body (slightly wider than store)
  const main = box(2.40, 1.50, 1.40, mat(0xddd8cc, 0.90));
  main.position.y = 0.75;
  g.add(main);

  // Gabled metal roof
  const roofGeo = new THREE.CylinderGeometry(0, 1.32, 0.52, 4, 1, false);
  roofGeo.rotateY(Math.PI / 4);
  const gableRoof = new THREE.Mesh(roofGeo, mat(0x607060, 0.48, 0.52));
  gableRoof.castShadow = true; gableRoof.position.y = 1.76;
  g.add(gableRoof);

  // Dark green sign fascia
  const fascia = box(2.40, 0.27, 0.04, mat(0x004d1a, 0.62));
  fascia.position.set(0, 1.38, 0.72);
  g.add(fascia);

  // Wide roll-up shutter (hardware loading)
  const shutter = box(1.20, 0.90, 0.04, mat(0x7a8090, 0.48, 0.42));
  shutter.position.set(-0.40, 0.50, 0.72);
  g.add(shutter);

  // Side entry door
  const door = box(0.32, 0.75, 0.04, mat(0x5a4830, 0.72));
  door.position.set(0.88, 0.42, 0.72);
  g.add(door);

  // Window (customer side)
  const win = box(0.28, 0.36, 0.02, M.glass, false);
  win.position.set(0.88, 0.88, 0.72);
  g.add(win);

  // Stacked lumber/materials display outside
  const stack1 = box(0.50, 0.25, 0.32, mat(0x8a7050, 0.90));
  stack1.position.set(-0.95, 0.18, 0.90);
  g.add(stack1);
  const stack2 = box(0.38, 0.16, 0.28, mat(0x7a6040, 0.90));
  stack2.position.set(-0.95, 0.39, 0.90);
  g.add(stack2);

  return g;
}

/** Puyangi White Beach Resort — beachfront pavilion, cabanas, umbrellas */
function buildBeach(): THREE.Group {
  const g = new THREE.Group();

  // Sandy ground platform
  const sand = box(7.0, 0.07, 6.0, mat(0xe8d888, 0.95), false);
  sand.position.y = 0.04;
  g.add(sand);

  // Main reception / office building
  const reception = box(2.8, 1.30, 1.5, mat(0xf5ead0, 0.88));
  reception.position.set(-1.8, 0.75, -1.8);
  g.add(reception);

  // Reception nipa roof (gabled)
  const recRoofGeo = new THREE.CylinderGeometry(0, 1.65, 0.75, 4, 1, false);
  recRoofGeo.rotateY(Math.PI / 4);
  const recRoof = new THREE.Mesh(recRoofGeo, mat(0x7a5020, 0.90));
  recRoof.castShadow = true;
  recRoof.position.set(-1.8, 1.68, -1.8);
  g.add(recRoof);

  // Welcome sign on reception
  const sign = box(2.0, 0.38, 0.05, mat(0x1a5a8a, 0.72));
  sign.position.set(-1.8, 1.42, -1.05);
  g.add(sign);

  // Beach cabanas (3 along the shore side)
  for (let i = 0; i < 3; i++) {
    const cabana = box(1.4, 0.9, 1.2, mat(0xf0e8d0, 0.90));
    cabana.position.set(1.8, 0.55, -1.8 + i * 1.7);
    g.add(cabana);
    const cabRoof = cone(0.88, 0.60, 8, mat(0x9a6830, 0.88));
    cabRoof.position.set(1.8, 1.20, -1.8 + i * 1.7);
    g.add(cabRoof);
  }

  // Beach umbrellas (colorful) with poles
  const umbColors = [0xff3333, 0x3399ff, 0xffcc00, 0x33cc33, 0xff66cc, 0xff9900];
  const umbPos: [number, number][] = [[-0.5, 1.2],[0.8, 1.8],[-0.2, 2.5],[1.2, 0.5],[-1.0, 1.8],[0.4, 0.8]];
  for (let i = 0; i < umbPos.length; i++) {
    const [ux, uz] = umbPos[i];
    const pole = cyl(0.022, 0.028, 1.15, 5, M.flagPole);
    pole.position.set(ux, 0.62, uz);
    g.add(pole);
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.22, 8), mat(umbColors[i % umbColors.length], 0.72));
    canopy.castShadow = true;
    canopy.position.set(ux, 1.26, uz);
    g.add(canopy);
  }

  // Entrance posts / arch
  for (const px of [-3.2, 3.2]) {
    const post = cyl(0.06, 0.08, 2.0, 6, mat(0xa07030, 0.88));
    post.position.set(px, 1.0, -3.2);
    g.add(post);
  }
  const archBar = box(6.6, 0.10, 0.12, mat(0xa07030, 0.88));
  archBar.position.set(0, 2.05, -3.2);
  g.add(archBar);

  // Narrow pathway to shoreline
  const path = box(0.6, 0.04, 2.5, mat(0xd8c878, 0.94), false);
  path.position.set(0, 0.06, 3.0);
  g.add(path);

  return g;
}

/** Taruc Swimming Pool — pool basin, deck, admin building, diving board */
function buildSwimmingPool(): THREE.Group {
  const g = new THREE.Group();

  // Concrete pool deck
  const deck = box(5.5, 0.10, 4.5, mat(0xc8c0b0, 0.88), false);
  deck.position.y = 0.05;
  g.add(deck);

  // Pool basin inner (blue water)
  const poolMat = mat(0x1890c8, 0.12, 0.30, { transparent: true, opacity: 0.88 });
  const pool = box(3.8, 0.06, 2.8, poolMat);
  pool.position.set(0, 0.10, 0);
  g.add(pool);

  // Pool rim / edge tiles (4 sides)
  const rimMat = mat(0xdad2c0, 0.82);
  const rims: [number, number, number, number, number][] = [
    [0, 1.55, 0.12, 0.20, 2.9],   // front
    [0, -1.55, 0.12, 0.20, 2.9],  // back
    [2.05, 0, 3.9, 0.20, 0.12],   // right
    [-2.05, 0, 3.9, 0.20, 0.12],  // left
  ];
  for (const [rx, rz, rw, rh, rd] of rims) {
    const rim = box(rw, rh, rd, rimMat);
    rim.position.set(rx, 0.14, rz);
    g.add(rim);
  }

  // Administration / changing rooms building
  const admin = box(2.4, 1.3, 1.2, mat(0xf0ece0, 0.88));
  admin.position.set(-1.8, 0.75, -2.5);
  g.add(admin);
  const adminRoof = box(2.6, 0.09, 1.4, mat(0x3a7ab8, 0.55, 0.15));
  adminRoof.position.set(-1.8, 1.39, -2.5);
  g.add(adminRoof);

  // Entrance gate posts
  for (const px of [-0.45, 0.45]) {
    const gpost = box(0.14, 1.1, 0.14, mat(0xc8c0b8, 0.85));
    gpost.position.set(px, 0.60, -2.5);
    g.add(gpost);
  }

  // Diving board
  const boardPost = box(0.09, 0.45, 0.09, mat(0xb0b0b8, 0.42, 0.55));
  boardPost.position.set(1.7, 0.28, -1.1);
  g.add(boardPost);
  const board = box(0.22, 0.055, 0.95, mat(0xffaa22, 0.68, 0.08));
  board.position.set(1.7, 0.52, -0.7);
  g.add(board);

  // Lounge chairs (6)
  const loungeColor = mat(0xf0b030, 0.80);
  const loungePos: [number, number][] = [[-2.4, 0.9],[-2.4, -0.2],[-2.4,-1.3],[2.4, 0.9],[2.4,-0.2],[2.4,-1.3]];
  for (const [lx, lz] of loungePos) {
    const chair = box(0.38, 0.06, 0.85, loungeColor);
    chair.position.set(lx, 0.15, lz);
    g.add(chair);
  }

  // Pool fence posts along front edge
  for (let i = 0; i < 9; i++) {
    const fp = cyl(0.028, 0.035, 0.85, 5, mat(0xb0b0a8, 0.68, 0.15));
    fp.position.set(-3.0 + i * 0.75, 0.47, 2.5);
    g.add(fp);
  }

  return g;
}

// ─── Builders Map ────────────────────────────────────────────────────────────

const BUILDERS: Record<LocationData["category"], () => THREE.Group> = {
  government:  buildMunicipalHall,
  church:      buildChurch,
  market:      buildMarket,
  port:        buildPort,
  school:      buildElementarySchool, // overridden per location below
  plaza:       buildPlaza,
  hospital:    buildHospital,
  commercial:  buildSoemco,           // overridden per id below
  beach:       buildBeach,
  recreation:  buildSwimmingPool,
};

// ─── Selection Ring ───────────────────────────────────────────────────────────

function selectionRing(color: string): THREE.Mesh {
  const geo = new THREE.TorusGeometry(1.5, 0.06, 8, 48);
  geo.rotateX(Math.PI / 2);
  const mat2 = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(geo, mat2);
  ring.name = "selectionRing";
  return ring;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function createBuildings(
  scene: THREE.Scene,
  terrain: THREE.Mesh,
  locations: LocationData[]
): BuildingGroup[] {
  return locations.map((loc) => {
    const group = new THREE.Group() as BuildingGroup;

    // Choose the right building type
    let building: THREE.Group;
    if (loc.id === "high-school") {
      building = buildHighSchool();
    } else if (loc.id === "elementary-school") {
      building = buildElementarySchool();
    } else if (loc.id === "palawan-pawnshop") {
      building = buildPalawanPawnshop();
    } else if (loc.id === "sofeco-store") {
      building = buildSofecoStore();
    } else if (loc.id === "sofeco-hardware") {
      building = buildSofecoHardware();
    } else {
      building = BUILDERS[loc.category]();
    }

    // Port is oriented east (toward bay at +X), so rotate it
    if (loc.category === "port") {
      building.rotation.y = -Math.PI / 2; // face east
    }

    group.add(building);

    // Selection ring at base
    const ring = selectionRing(loc.color);
    ring.position.y = 0.02;
    group.add(ring);

    // Place on terrain
    const y = getTerrainHeight(terrain, loc.position[0], loc.position[2]);
    group.position.set(loc.position[0], y, loc.position[2]);

    group.userData = {
      location: loc,
      baseY: y,
      isBuilding: true,
    };

    scene.add(group);
    return group;
  });
}

// Exported so landmarkLights.ts can animate emissive intensity on all windows
export const GLASS_MATS: THREE.MeshStandardMaterial[] = [M.glass, M.glassDark];
