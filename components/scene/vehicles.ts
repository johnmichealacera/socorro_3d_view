import * as THREE from "three";
import { OSM_ROADS } from "./roads";
import { terrainHeight } from "./terrain";

export interface VehicleData {
  mesh:        THREE.Group;
  wheels:      THREE.Mesh[];
  pts:         [number, number][];
  arcLengths:  number[];
  totalLength: number;
  t:           number;   // 0..1 along path
  speed:       number;   // scene units per second
  direction:   number;   // 1 or -1
  wheelAngle:  number;
}

// ── Path utilities ────────────────────────────────────────────────────────────

function buildArcLengths(pts: [number, number][]): number[] {
  const lens = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dz = pts[i][1] - pts[i - 1][1];
    lens.push(lens[i - 1] + Math.sqrt(dx * dx + dz * dz));
  }
  return lens;
}

function samplePath(
  pts: [number, number][],
  arcs: number[],
  total: number,
  t: number
): { x: number; z: number; dx: number; dz: number } {
  const target = THREE.MathUtils.clamp(t, 0, 1) * total;
  let lo = 0;
  for (let i = 0; i < arcs.length - 2; i++) {
    if (arcs[i + 1] >= target) { lo = i; break; }
    lo = i + 1;
  }
  const segLen = arcs[lo + 1] - arcs[lo];
  const segT   = segLen < 0.0001 ? 0 : (target - arcs[lo]) / segLen;
  return {
    x:  pts[lo][0] + (pts[lo + 1][0] - pts[lo][0]) * segT,
    z:  pts[lo][1] + (pts[lo + 1][1] - pts[lo][1]) * segT,
    dx: pts[lo + 1][0] - pts[lo][0],
    dz: pts[lo + 1][1] - pts[lo][1],
  };
}

// ── Tricycle geometry ─────────────────────────────────────────────────────────

function buildTricycle(bodyColor: number): { group: THREE.Group; wheels: THREE.Mesh[] } {
  const group = new THREE.Group();

  const bodyMat  = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.62, metalness: 0.18 });
  const darkMat  = new THREE.MeshStandardMaterial({ color: 0x1a1a1a,  roughness: 0.95 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88aacc, roughness: 0.08, transparent: true, opacity: 0.52,
  });

  // Passenger cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.22, 0.54), bodyMat);
  cabin.position.set(0, 0.22, 0);
  cabin.castShadow = true;
  group.add(cabin);

  // Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.03, 0.56), bodyMat);
  roof.position.set(0, 0.345, 0);
  roof.castShadow = true;
  group.add(roof);

  // Front windscreen
  const wind = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.13, 0.02), glassMat);
  wind.position.set(0, 0.275, -0.285);
  group.add(wind);

  // Driver silhouette
  const driver = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.17, 0.09),
    new THREE.MeshStandardMaterial({ color: 0x1e1008, roughness: 0.95 })
  );
  driver.position.set(-0.11, 0.41, -0.10);
  group.add(driver);

  // Wheels — cylinders lying on their side
  // rotation.x = PI/2 so the circular face is in the XZ plane
  const wheelGeo = new THREE.CylinderGeometry(0.088, 0.088, 0.055, 10);
  const wheels: THREE.Mesh[] = [];

  const wPts: [number, number, number][] = [
    [ 0.00, 0.088, -0.26],  // front
    [-0.26, 0.088,  0.21],  // rear left
    [ 0.26, 0.088,  0.21],  // rear right
  ];

  for (const [wx, wy, wz] of wPts) {
    const w = new THREE.Mesh(wheelGeo, darkMat);
    w.rotation.z = Math.PI / 2;  // lay the cylinder as a wheel
    w.position.set(wx, wy, wz);
    w.castShadow = true;
    group.add(w);
    wheels.push(w);
  }

  return { group, wheels };
}

// ── Public API ────────────────────────────────────────────────────────────────

const ROAD_CONFIGS = [
  { name: "Main Street",    color: 0xf5c518, speed: 2.8, startT: 0.10 },
  { name: "Port Road",      color: 0x1a6fcc, speed: 3.2, startT: 0.60 },
  { name: "Beach Road",     color: 0xe03030, speed: 2.4, startT: 0.30 },
  { name: "Poblacion Road", color: 0x22aa55, speed: 3.0, startT: 0.75 },
];

export function createVehicles(scene: THREE.Scene): VehicleData[] {
  const vehicles: VehicleData[] = [];

  for (const cfg of ROAD_CONFIGS) {
    const road = OSM_ROADS.find(r => r.name === cfg.name);
    if (!road || road.pts.length < 2) continue;

    const arcs  = buildArcLengths(road.pts);
    const total = arcs[arcs.length - 1];
    if (total < 1) continue;

    const { group, wheels } = buildTricycle(cfg.color);
    group.scale.setScalar(0.80);
    scene.add(group);

    vehicles.push({
      mesh: group,
      wheels,
      pts: road.pts,
      arcLengths: arcs,
      totalLength: total,
      t: cfg.startT,
      speed: cfg.speed,
      direction: 1,
      wheelAngle: 0,
    });
  }

  return vehicles;
}

export function updateVehicles(vehicles: VehicleData[], delta: number): void {
  for (const v of vehicles) {
    v.t += v.direction * v.speed * delta / v.totalLength;
    if (v.t >= 1.0) { v.t = 1.0; v.direction = -1; }
    if (v.t <= 0.0) { v.t = 0.0; v.direction =  1; }

    const { x, z, dx, dz } = samplePath(v.pts, v.arcLengths, v.totalLength, v.t);
    const y = Math.max(0.01, terrainHeight(x, z));
    v.mesh.position.set(x, y + 0.015, z);

    // Face direction of travel
    if (Math.abs(dx) + Math.abs(dz) > 0.001) {
      const fx = v.direction > 0 ? dx : -dx;
      const fz = v.direction > 0 ? dz : -dz;
      v.mesh.rotation.y = Math.atan2(fx, fz);
    }

    // Spin wheels (rotation.z accumulates because wheel cylinder axis is now X after z-rotation)
    v.wheelAngle += v.speed * delta * 4.0;
    for (const w of v.wheels) {
      // The wheel was initially rotated z=PI/2. We want the circular rolling to happen
      // around that same axis, which in the rotated frame is the local X axis.
      // Three.js applies Euler in XYZ order, so we just set x on top of the z rotation.
      w.rotation.x = v.wheelAngle;
    }
  }
}

export function disposeVehicles(vehicles: VehicleData[]): void {
  for (const v of vehicles) {
    v.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const m = child.material;
        if (Array.isArray(m)) m.forEach(x => x.dispose());
        else m.dispose();
      }
    });
    v.mesh.removeFromParent();
  }
}
