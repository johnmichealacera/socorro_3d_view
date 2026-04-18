/**
 * Socorro road network — landmark-connecting roads
 * Coordinates derived from updated LOCATIONS positions.
 * Scale: 1 unit ≈ 10 m   |   East = +X  |  North = −Z
 */

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { terrainHeight } from "./terrain";

// ─── Road data types ──────────────────────────────────────────────────────────

export interface RoadData {
  type: string;
  name: string;
  width: number;
  pts: [number, number][];
}

// ─── Landmark-connecting road network ────────────────────────────────────────
// Coordinates match updated LOCATIONS positions (x, z only; y from terrain).
// Origin = Municipal Hall area.  East = +X, North = −Z, scale 1 unit ≈ 10 m.

export const OSM_ROADS: RoadData[] = [

  // ── 1. Port (26,4) → Public Market (15,6) ────────────────────────────────
  //    Coastal access road running west along the shoreline
  {
    type: "tertiary", name: "Port Road", width: 0.22,
    pts: [[26,4],[22,4.5],[18,5.5],[15,6]],
  },

  // ── 2. Public Market (15,6) → Municipal Hall (8,−4) ──────────────────────
  //    Main commercial street, passes SOEMCO (13,2) on the way
  {
    type: "tertiary", name: "Main Street", width: 0.22,
    pts: [[15,6],[13,2],[11,0],[9,-2],[8,-4]],
  },

  // ── 3. Municipal Hall (8,−4) → Plaza (3,−4) → Church (−3,−4) ────────────
  //    East–west poblacion spine through the civic core
  {
    type: "tertiary", name: "Poblacion Road", width: 0.22,
    pts: [[8,-4],[3,-4],[-3,-4]],
  },

  // ── 4. Church (−3,−4) → Sofeco Hardware (−6,0) → Pawnshop (−9,0) ────────
  //    Bends south-west from the church toward the commercial strip
  {
    type: "residential", name: "Commercial Street", width: 0.18,
    pts: [[-3,-4],[-4.5,-2],[-6,0],[-7.5,0],[-9,0]],
  },

  // ── 5. Cross-street: Pawnshop (−9,0) ↔ Sofeco Store (−9,3) ──────────────
  //    Short connecting lane; store sits directly across the street
  {
    type: "service", name: "", width: 0.12,
    pts: [[-9,0],[-9,1.5],[-9,3]],
  },

  // ── 6. Pawnshop (−9,0) → Elementary School (−22,−12) ────────────────────
  //    Road curves north-west toward the school
  {
    type: "residential", name: "School Road", width: 0.18,
    pts: [[-9,0],[-13,-4],[-17,-8],[-20,-10],[-22,-12]],
  },

  // ── 7. Elementary School (−22,−12) → Hospital (−35,−12) ─────────────────
  //    Straight westward road at the same latitude
  {
    type: "residential", name: "Hospital Road", width: 0.18,
    pts: [[-22,-12],[-27,-12],[-31,-12],[-35,-12]],
  },

  // ── 8. Main road spur → National High School (8,22) ──────────────────────
  {
    type: "residential", name: "High School Road", width: 0.18,
    pts: [[11,12],[10,17],[8,22]],
  },

  // ── 9. High School (8,22) → Taruc Pool (16,34) → Puyangi Beach (28,44) ──
  {
    type: "tertiary", name: "Beach Road", width: 0.22,
    pts: [[8,22],[12,28],[16,34],[22,40],[28,44]],
  },
];

// ─── Materials ────────────────────────────────────────────────────────────────

const MAT_ASPHALT = new THREE.MeshStandardMaterial({
  color: 0x3e3e3e,
  roughness: 0.97,
  metalness: 0.0,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits: -2,
});

const MAT_ROAD_LOCAL = new THREE.MeshStandardMaterial({
  color: 0x484840,
  roughness: 0.97,
  metalness: 0.0,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits: -2,
});

const MAT_DIRT = new THREE.MeshStandardMaterial({
  color: 0x8a7a60,
  roughness: 0.99,
  metalness: 0.0,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
});

const MAT_CENTER_LINE = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.85,
  metalness: 0.0,
  polygonOffset: true,
  polygonOffsetFactor: -3,
  polygonOffsetUnits: -3,
});

function getRoadMat(type: string): THREE.MeshStandardMaterial {
  if (type === "tertiary" || type === "secondary" || type === "unclassified") return MAT_ASPHALT;
  if (type === "residential" || type === "service") return MAT_ROAD_LOCAL;
  return MAT_DIRT;
}

// ─── Geometry builder ─────────────────────────────────────────────────────────

const LIFT = 0.04; // raise roads above terrain to avoid z-fighting

function buildRibbonGeo(
  pts: [number, number][],
  halfWidth: number,
  lift = LIFT
): THREE.BufferGeometry | null {
  if (pts.length < 2) return null;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  let uAcc = 0;
  let base = 0;

  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];

    // Skip if both points are outside terrain bounds (rough check)
    if (x0 < -56 && x1 < -56) continue;
    if (x0 > 38 && x1 > 38) continue;

    const y0 = Math.max(0.005, terrainHeight(x0, z0)) + lift;
    const y1 = Math.max(0.005, terrainHeight(x1, z1)) + lift;

    const dx = x1 - x0;
    const dz = z1 - z0;
    const segLen = Math.sqrt(dx * dx + dz * dz);
    if (segLen < 0.001) continue;

    // Road perpendicular
    const px = (-dz / segLen) * halfWidth;
    const pz = ( dx / segLen) * halfWidth;

    const u0 = uAcc;
    const u1 = uAcc + segLen;
    uAcc = u1;

    positions.push(
      x0 - px, y0, z0 - pz,
      x0 + px, y0, z0 + pz,
      x1 - px, y1, z1 - pz,
      x1 + px, y1, z1 + pz
    );
    normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
    uvs.push(0, u0, 1, u0, 0, u1, 1, u1);
    indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    base += 4;
  }

  if (indices.length === 0) return null;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

/** Centre-line dashes for tertiary / secondary roads */
function buildCentreLineGeo(
  pts: [number, number][],
  dashLen = 0.6,
  gapLen = 0.5,
  halfW = 0.012
): THREE.BufferGeometry | null {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let base = 0;

  let inDash = true;
  let dashRemain = dashLen;

  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const dx = x1 - x0, dz = z1 - z0;
    const segLen = Math.sqrt(dx * dx + dz * dz);
    if (segLen < 0.001) continue;

    const ux = dx / segLen, uz = dz / segLen;
    const px = -uz * halfW, pz = ux * halfW;

    let t = 0;
    while (t < segLen) {
      const step = Math.min(dashRemain, segLen - t);

      if (inDash && step > 0.01) {
        const ax = x0 + ux * t, az = z0 + uz * t;
        const bx = ax + ux * step, bz = az + uz * step;
        const ya = Math.max(0.005, terrainHeight(ax, az)) + LIFT + 0.01;
        const yb = Math.max(0.005, terrainHeight(bx, bz)) + LIFT + 0.01;

        positions.push(
          ax - px, ya, az - pz,
          ax + px, ya, az + pz,
          bx - px, yb, bz - pz,
          bx + px, yb, bz + pz
        );
        normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
        indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
        base += 4;
      }

      t += step;
      dashRemain -= step;

      if (dashRemain <= 0.001) {
        inDash = !inDash;
        dashRemain = inDash ? dashLen : gapLen;
      }
    }
  }

  if (indices.length === 0) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function createRoads(scene: THREE.Scene): void {
  const centreGeos: THREE.BufferGeometry[] = [];

  for (const road of OSM_ROADS) {
    const halfW = road.width * 0.5;
    const geo = buildRibbonGeo(road.pts, halfW);
    if (!geo) continue;

    const mesh = new THREE.Mesh(geo, getRoadMat(road.type));
    mesh.receiveShadow = false;
    mesh.castShadow = false;
    mesh.name = "road";
    scene.add(mesh);

    // Centre-line dashes for main roads
    if (road.type === "tertiary" || road.type === "unclassified") {
      const cGeo = buildCentreLineGeo(road.pts);
      if (cGeo) centreGeos.push(cGeo);
    }
  }

  // Merge all centre-line dashes into one draw call
  if (centreGeos.length > 0) {
    const merged = mergeGeometries(centreGeos, false);
    if (merged) {
      const lineMesh = new THREE.Mesh(merged, MAT_CENTER_LINE);
      lineMesh.name = "roadCentreLines";
      scene.add(lineMesh);
    }
    centreGeos.forEach((g) => g.dispose());
  }
}
