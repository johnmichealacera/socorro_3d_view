import * as THREE from "three";

// ─── Scale & Coordinate Constants ─────────────────────────────────────────────
// 1 scene unit ≈ 10 m.  Terrain covers 100×100 units = 1 km².
// East coast (bay) at x ≈ +32.  Inland hills rise to the west (−x).
// ─────────────────────────────────────────────────────────────────────────────

const TERRAIN_SIZE = 160;
const HALF_SIZE    = 80;   // half of TERRAIN_SIZE
const TERRAIN_SEGS = 256;
const SHORE_X = 30; // coastline X in scene units

/** Procedural terrain height at any (x, z) position in scene units. */
export function terrainHeight(x: number, z: number): number {
  // Below the bay
  if (x > SHORE_X + 2) return -1.0;

  // Shore/beach slope
  const shoreFactor = Math.max(0, (SHORE_X - x) / SHORE_X);

  // Gentle coastal flat (town area)  x: 0 → 30
  const coastalFlat = Math.min(1, shoreFactor) * 0.35;

  // Inland rise — hills grow toward the west
  const inlandFactor = Math.max(0, -x / 45);
  const hill =
    inlandFactor * inlandFactor * 5.5 +
    Math.sin(x * 0.13 + z * 0.09) * inlandFactor * 2.0 +
    Math.cos(x * 0.07 - z * 0.11) * inlandFactor * 1.2 +
    Math.sin((x - z) * 0.18) * inlandFactor * 0.8;

  // Fine surface texture
  const detail =
    Math.sin(x * 0.9 + z * 0.7) * 0.06 +
    Math.cos(x * 0.5 - z * 1.1) * 0.05 +
    Math.sin((x + z) * 0.4) * 0.04;

  return Math.max(0, coastalFlat + Math.max(0, hill) + detail);
}

// ─── Satellite-Style Terrain Texture ─────────────────────────────────────────

function wx(worldX: number, W: number): number {
  return ((worldX + HALF_SIZE) / TERRAIN_SIZE) * W;
}
function wz(worldZ: number, H: number): number {
  return ((worldZ + HALF_SIZE) / TERRAIN_SIZE) * H;
}

/** Draw a natural vegetation patch using layered ellipses */
function vegPatch(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
  alpha = 0.35
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function generateSatelliteTexture(): THREE.CanvasTexture {
  const W = 2048, H = 2048;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── 1. Base land – rich tropical green ──────────────────────────────
  ctx.fillStyle = "#2e6a24";
  ctx.fillRect(0, 0, W, H);

  // ── 2. Interior hills (west side, x < −5) – dense dark forest ───────
  const hillGrad = ctx.createLinearGradient(0, 0, wx(-5, W), 0);
  hillGrad.addColorStop(0.0, "#0f2a0d");
  hillGrad.addColorStop(0.5, "#1a3e15");
  hillGrad.addColorStop(1.0, "#254a1e");
  ctx.fillStyle = hillGrad;
  ctx.fillRect(0, 0, wx(-5, W), H);

  // ── 3. Transition zone (x: −5 → +10) – mixed vegetation ────────────
  const transGrad = ctx.createLinearGradient(wx(-5, W), 0, wx(10, W), 0);
  transGrad.addColorStop(0, "#254a1e");
  transGrad.addColorStop(1, "#3a7830");
  ctx.fillStyle = transGrad;
  ctx.fillRect(wx(-5, W), 0, wx(10, W) - wx(-5, W), H);

  // ── 4. Coastal flat / urban zone (x: +10 → +22) ─────────────────────
  const urbanGrad = ctx.createLinearGradient(wx(10, W), 0, wx(22, W), 0);
  urbanGrad.addColorStop(0, "#4a7838");
  urbanGrad.addColorStop(0.4, "#5a7860");   // greener with some urban
  urbanGrad.addColorStop(1, "#707868");      // more gray near shore road
  ctx.fillStyle = urbanGrad;
  ctx.fillRect(wx(10, W), 0, wx(22, W) - wx(10, W), H);

  // ── 5. Sandy beach (x: +22 → +30) ───────────────────────────────────
  const beachGrad = ctx.createLinearGradient(wx(22, W), 0, wx(30, W), 0);
  beachGrad.addColorStop(0, "#b8a870");
  beachGrad.addColorStop(0.5, "#d0b878");
  beachGrad.addColorStop(1, "#e8d090");
  ctx.fillStyle = beachGrad;
  ctx.fillRect(wx(22, W), 0, wx(30, W) - wx(22, W), H);

  // ── 6. Shallow water / turquoise (x: +30 → +40) ──────────────────────
  const shallowGrad = ctx.createLinearGradient(wx(30, W), 0, wx(42, W), 0);
  shallowGrad.addColorStop(0, "#a0dce0");
  shallowGrad.addColorStop(0.5, "#60c0d8");
  shallowGrad.addColorStop(1, "#38a8c8");
  ctx.fillStyle = shallowGrad;
  ctx.fillRect(wx(30, W), 0, wx(42, W) - wx(30, W), H);

  // ── 7. Deep ocean (x > +40) ──────────────────────────────────────────
  const deepGrad = ctx.createLinearGradient(wx(42, W), 0, W, 0);
  deepGrad.addColorStop(0, "#38a8c8");
  deepGrad.addColorStop(0.3, "#1878b0");
  deepGrad.addColorStop(1, "#0848a0");
  ctx.fillStyle = deepGrad;
  ctx.fillRect(wx(42, W), 0, W - wx(42, W), H);

  // ── 8. Vegetation texture patches (darker/lighter clusters) ──────────
  const greenShades = ["#1e5018", "#2a6020", "#346828", "#3e7030", "#487838"];
  // Forest patches on hills
  for (let i = 0; i < 120; i++) {
    const ox = (Math.random() - 0.5) * 80 - 15; // west bias
    const oz = (Math.random() - 0.5) * 90;
    const shade = greenShades[Math.floor(Math.random() * greenShades.length)];
    vegPatch(ctx, wx(ox, W), wz(oz, H), 30 + Math.random() * 60, 20 + Math.random() * 50, shade, 0.45);
  }
  // Lighter clearings
  for (let i = 0; i < 40; i++) {
    const ox = (Math.random() - 0.5) * 60 - 10;
    const oz = (Math.random() - 0.5) * 80;
    vegPatch(ctx, wx(ox, W), wz(oz, H), 12 + Math.random() * 25, 8 + Math.random() * 20, "#5a9040", 0.25);
  }
  // Coconut palm grove patches near coast
  for (let i = 0; i < 50; i++) {
    const ox = 5 + Math.random() * 16; // x: 5 to 21
    const oz = (Math.random() - 0.5) * 90;
    vegPatch(ctx, wx(ox, W), wz(oz, H), 8 + Math.random() * 20, 6 + Math.random() * 15, "#2e6828", 0.35);
  }

  // ── 8b. Puyangi White Beach — sandy resort patch near shore ──────────
  const beachGrad2 = ctx.createLinearGradient(wx(22, W), wz(38, H), wx(32, W), wz(50, H));
  beachGrad2.addColorStop(0, "#d8c878");
  beachGrad2.addColorStop(0.6, "#e8d888");
  beachGrad2.addColorStop(1, "#f0e098");
  ctx.save();
  ctx.globalAlpha = 0.80;
  ctx.fillStyle = beachGrad2;
  ctx.fillRect(wx(22, W), wz(38, H), wx(32, W) - wx(22, W), wz(50, H) - wz(38, H));
  ctx.restore();

  // ── 8c. Taruc Swimming Pool area — lighter clearing ───────────────────
  vegPatch(ctx, wx(16, W), wz(34, H), (4 / 160) * W, (3 / 160) * H, "#d8d0b8", 0.55);

  // ── 9. Urban block texture (updated to match new landmark positions) ──
  ctx.save();
  ctx.globalAlpha = 0.50;
  const blocks = [
    { x0: -38, z0: -15, x1: -20, z1: -9,  color: "#606858" },  // hospital / elementary corridor
    { x0: -12, z0:  -5, x1:  -4, z1:   5, color: "#747068" },  // commercial strip (pawnshop/sofeco)
    { x0:  -5, z0:  -6, x1:  10, z1:   2, color: "#7a7868" },  // municipal / plaza / church block
    { x0:  10, z0:  -5, x1:  18, z1:   9, color: "#808878" },  // market / SOEMCO block
    { x0:  18, z0:   0, x1:  28, z1:   8, color: "#7a8878" },  // shore / port district
    { x0:   5, z0:  18, x1:  13, z1:  25, color: "#6a7860" },  // high school district
  ];
  for (const blk of blocks) {
    ctx.fillStyle = blk.color;
    ctx.fillRect(
      wx(blk.x0, W), wz(blk.z0, H),
      wx(blk.x1, W) - wx(blk.x0, W),
      wz(blk.z1, H) - wz(blk.z0, H)
    );
  }
  ctx.restore();

  // ── 10. Landmark-connecting road network painted on satellite texture ────
  // Matches the 3D road geometry in roads.ts — keep both in sync.
  function drawRoad(pts: [number, number][], lineW: number, color: string) {
    if (pts.length < 2) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineW;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(wx(pts[0][0], W), wz(pts[0][1], H));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(wx(pts[i][0], W), wz(pts[i][1], H));
    ctx.stroke();
    ctx.restore();
  }

  // Main roads (tertiary)
  const mainColor = "#9a9080", mainW = 9;
  drawRoad([[26,4],[22,4.5],[18,5.5],[15,6]], mainW, mainColor);               // Port → Market
  drawRoad([[15,6],[13,2],[11,0],[9,-2],[8,-4]], mainW, mainColor);             // Market → Municipal
  drawRoad([[8,-4],[3,-4],[-3,-4]], mainW, mainColor);                         // Municipal → Church (E–W spine)

  // Local roads (residential)
  const localColor = "#7a7868", localW = 6;
  drawRoad([[-3,-4],[-4.5,-2],[-6,0],[-9,0]], localW, localColor);             // Church → Pawnshop
  drawRoad([[-9,0],[-9,3]], localW, localColor);                                // Pawnshop ↔ Sofeco Store
  drawRoad([[-9,0],[-13,-4],[-17,-8],[-20,-10],[-22,-12]], localW, localColor); // Pawnshop → Elementary
  drawRoad([[-22,-12],[-27,-12],[-31,-12],[-35,-12]], localW, localColor);      // Elementary → Hospital
  drawRoad([[11,12],[10,17],[8,22]], localW, localColor);                         // Main road → High School
  drawRoad([[8,22],[12,28],[16,34],[22,40],[28,44]], mainW, mainColor);           // HS → Taruc → Puyangi

  // ── 11. Building patches at updated LOCATIONS positions ───────────────
  const roofPatches: { x: number; z: number; w: number; h: number; fill: string }[] = [
    { x:  7.3, z: -4.8, w: 2.8, h: 1.6, fill: "#c0b8b0" }, // Municipal Hall – light concrete
    { x: -3.9, z: -4.8, w: 1.8, h: 3.2, fill: "#ece4d8" }, // Church – cream plaster
    { x:  2.0, z: -5.5, w: 5.5, h: 4.5, fill: "#3a6820" }, // Plaza – green park
    { x: 14.2, z:  5.2, w: 4.8, h: 3.5, fill: "#8a4030" }, // Market – rust roof
    { x: 24.5, z:  3.0, w: 3.2, h: 0.8, fill: "#707878" }, // Port pier – concrete
    { x: 24.5, z:  2.2, w: 2.8, h: 1.8, fill: "#606870" }, // Port warehouse
    { x:-22.8, z:-12.8, w: 4.5, h: 1.2, fill: "#5a7858" }, // Elementary – green roof
    { x:  7.0, z: 21.0, w: 6.0, h: 1.5, fill: "#4a7050" }, // High School – green roof
    { x:-35.5, z:-12.8, w: 3.2, h: 1.5, fill: "#b0c8e0" }, // Hospital – blue-grey roof
    { x: 12.5, z:  1.5, w: 2.0, h: 1.3, fill: "#c8a040" }, // SOEMCO – yellow fascia
    { x: -9.6, z: -0.5, w: 1.4, h: 1.0, fill: "#1a9ab0" }, // Pawnshop – teal
    { x: -9.6, z:  2.6, w: 2.0, h: 1.2, fill: "#3a7828" }, // Sofeco Store – green
    { x: -6.6, z: -0.5, w: 2.3, h: 1.4, fill: "#7a6848" }, // Sofeco Hardware – brown
    { x: 15.0, z: 33.2, w: 4.5, h: 3.5, fill: "#2090c0" }, // Taruc Pool – blue water
    { x: 26.5, z: 42.5, w: 5.5, h: 4.5, fill: "#e8d888" }, // Puyangi Beach – sandy
  ];
  ctx.save();
  ctx.globalAlpha = 0.7;
  for (const p of roofPatches) {
    ctx.fillStyle = p.fill;
    ctx.fillRect(wx(p.x, W), wz(p.z, H), (p.w / 100) * W, (p.h / 100) * H);
  }
  ctx.restore();

  // ── 12. Mangrove fringe (dark line along beach inner edge) ─────────
  vegPatch(ctx, wx(23, W), wz(0, H), (2 / 100) * W, H * 0.5, "#1a4818", 0.3);

  // ── 13. Subtle noise grain for satellite texture feel ─────────────
  const imgData = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const g = (Math.random() - 0.5) * 14;
    imgData.data[i]     = Math.min(255, Math.max(0, imgData.data[i] + g));
    imgData.data[i + 1] = Math.min(255, Math.max(0, imgData.data[i + 1] + g));
    imgData.data[i + 2] = Math.min(255, Math.max(0, imgData.data[i + 2] + g));
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function createTerrain(scene: THREE.Scene): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGS, TERRAIN_SEGS);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, terrainHeight(x, z));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const diffuse = generateSatelliteTexture();
  diffuse.wrapS = diffuse.wrapT = THREE.ClampToEdgeWrapping;

  const mat = new THREE.MeshStandardMaterial({
    map: diffuse,
    roughness: 0.92,
    metalness: 0.0,
    envMapIntensity: 0.4,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = "terrain";
  scene.add(mesh);
  return mesh;
}

export function getTerrainHeight(terrain: THREE.Mesh, x: number, z: number): number {
  const raycaster = new THREE.Raycaster(
    new THREE.Vector3(x, 20, z),
    new THREE.Vector3(0, -1, 0)
  );
  const hits = raycaster.intersectObject(terrain);
  return hits.length > 0 ? hits[0].point.y : 0;
}
