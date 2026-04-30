/**
 * Street lamp system — lamp posts along Socorro's road network.
 * Lamps turn on at dusk (~17:30 PHT) and off at dawn (~06:30 PHT).
 * Uses InstancedMesh (2 draw calls for all poles/heads) + shared glow sprites.
 */
import * as THREE from "three";
import { OSM_ROADS } from "./roads";
import { terrainHeight } from "./terrain";
import { getPHTHoursDecimal, isSimulating } from "./timeOverride";

// ── Constants ─────────────────────────────────────────────────────────────────

const POLE_H      = 1.55;  // scene units (~15.5 m)
const SIDE_OFFSET = 0.30;  // lateral offset from road centre
const WATER_X     = 23;    // don't place lamps in the bay
const MAP_BOUNDS  = { xMin: -55, xMax: 34, zMin: -30, zMax: 65 };

// ── Shared materials ───────────────────────────────────────────────────────────

const _matPole = new THREE.MeshStandardMaterial({
  color: 0x606870, roughness: 0.75, metalness: 0.40,
});

const _matHead = new THREE.MeshStandardMaterial({
  color:             new THREE.Color(0xffeedd), // pale warm white when off
  emissive:          new THREE.Color(0xffaa30), // sodium vapor amber
  emissiveIntensity: 0,
  roughness:         0.15,
  metalness:         0.0,
});

// ── Glow halo texture ─────────────────────────────────────────────────────────

let _glowTex: THREE.CanvasTexture | null = null;
function getGlowTex(): THREE.CanvasTexture {
  if (_glowTex) return _glowTex;
  const S = 64;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0.00, "rgba(255,190,70,0.95)");
  g.addColorStop(0.25, "rgba(255,150,30,0.55)");
  g.addColorStop(0.65, "rgba(255,100,10,0.15)");
  g.addColorStop(1.00, "rgba(255, 80, 0,0.00)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  _glowTex = new THREE.CanvasTexture(c);
  return _glowTex;
}

let _glowMat: THREE.SpriteMaterial | null = null;
function getGlowMat(): THREE.SpriteMaterial {
  if (!_glowMat) {
    _glowMat = new THREE.SpriteMaterial({
      map:        getGlowTex(),
      transparent: true,
      opacity:     0,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
      fog:         false,
    });
  }
  return _glowMat;
}

// ── Road sampling ─────────────────────────────────────────────────────────────

interface Sample { x: number; z: number; nx: number; nz: number; }

function sampleRoad(pts: [number, number][], spacing: number): Sample[] {
  const result: Sample[] = [];
  let accumulated = 0;
  let nextSample  = spacing * 0.40; // start slightly in from each road end

  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const dx = x1 - x0, dz = z1 - z0;
    const segLen = Math.sqrt(dx * dx + dz * dz);
    if (segLen < 0.001) continue;
    const ux = dx / segLen, uz = dz / segLen;

    while (accumulated + segLen >= nextSample) {
      const t  = (nextSample - accumulated) / segLen;
      result.push({
        x: x0 + ux * t * segLen,
        z: z0 + uz * t * segLen,
        nx: -uz,  // left-side perpendicular
        nz:  ux,
      });
      nextSample += spacing;
    }
    accumulated += segLen;
  }
  return result;
}

// ── Lamp post builder ─────────────────────────────────────────────────────────

interface LampPos { x: number; y: number; z: number; }

function collectLampPositions(): LampPos[] {
  const positions: LampPos[] = [];

  for (const road of OSM_ROADS) {
    if (road.type === "service") continue;

    const spacing   = road.type === "tertiary" ? 4.8 : 6.5;
    const bothSides = road.type === "tertiary";
    const samples   = sampleRoad(road.pts, spacing);

    for (const { x, z, nx, nz } of samples) {
      const sides = bothSides ? [+1, -1] : [+1];
      for (const s of sides) {
        const lx = x + nx * SIDE_OFFSET * s;
        const lz = z + nz * SIDE_OFFSET * s;

        // Bounds / water guards
        if (lx > WATER_X) continue;
        if (lx < MAP_BOUNDS.xMin || lx > MAP_BOUNDS.xMax) continue;
        if (lz < MAP_BOUNDS.zMin || lz > MAP_BOUNDS.zMax) continue;

        const ly = Math.max(0, terrainHeight(lx, lz));
        positions.push({ x: lx, y: ly, z: lz });
      }
    }
  }
  return positions;
}

// ── Key-area point lights (real illumination at landmark nodes) ───────────────

const KEY_LIGHTS: [number, number, number][] = [
  [  3.0, 3.2, -4.0 ], // plaza
  [  8.0, 3.2, -4.0 ], // municipal hall
  [ 15.0, 3.0,  6.0 ], // market
  [ 26.0, 3.0,  4.0 ], // port
  [ -3.0, 3.0, -4.0 ], // church
  [-22.0, 3.0,-12.0 ], // elementary school
  [  8.0, 3.0, 22.0 ], // national high school
  [  0.0, 3.0,  0.0 ], // town centre
];

// ── Public API ────────────────────────────────────────────────────────────────

export interface LampSystem {
  polesIM:     THREE.InstancedMesh;
  headsIM:     THREE.InstancedMesh;
  glows:       THREE.Sprite[];
  keyLights:   THREE.PointLight[];
  intensity:   number;
}

export function createStreetLamps(scene: THREE.Scene): LampSystem {
  const lampPos = collectLampPositions();
  const n       = lampPos.length;
  const dummy   = new THREE.Object3D();

  // ── InstancedMesh for poles ──────────────────────────────────────────────
  const poleGeo = new THREE.CylinderGeometry(0.022, 0.032, POLE_H, 5);
  const polesIM = new THREE.InstancedMesh(poleGeo, _matPole, n);
  polesIM.castShadow    = false;
  polesIM.receiveShadow = false;
  polesIM.name          = "streetLampPoles";

  // ── InstancedMesh for lamp heads ─────────────────────────────────────────
  const headGeo = new THREE.SphereGeometry(0.09, 7, 5);
  const headsIM = new THREE.InstancedMesh(headGeo, _matHead, n);
  headsIM.castShadow    = false;
  headsIM.receiveShadow = false;
  headsIM.name          = "streetLampHeads";

  // ── Glow sprites (one per lamp, shared SpriteMaterial) ───────────────────
  const glows: THREE.Sprite[] = [];
  const gm = getGlowMat();

  for (let i = 0; i < n; i++) {
    const { x, y, z } = lampPos[i];

    // Pole instance
    dummy.position.set(x, y + POLE_H * 0.5, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    polesIM.setMatrixAt(i, dummy.matrix);

    // Head instance
    dummy.position.set(x, y + POLE_H + 0.05, z);
    dummy.updateMatrix();
    headsIM.setMatrixAt(i, dummy.matrix);

    // Glow sprite — unique instance, shared material
    const sp = new THREE.Sprite(gm.clone());
    (sp.material as THREE.SpriteMaterial).opacity = 0;
    sp.scale.set(2.6, 2.6, 1);
    sp.position.set(x, y + POLE_H - 0.15, z);
    scene.add(sp);
    glows.push(sp);
  }

  polesIM.instanceMatrix.needsUpdate = true;
  headsIM.instanceMatrix.needsUpdate = true;
  scene.add(polesIM);
  scene.add(headsIM);

  // ── Key-area PointLights ─────────────────────────────────────────────────
  const keyLights: THREE.PointLight[] = [];
  for (const [x, y, z] of KEY_LIGHTS) {
    const pl = new THREE.PointLight(0xffb030, 0, 20, 2.0);
    pl.position.set(x, y, z);
    pl.castShadow = false;
    scene.add(pl);
    keyLights.push(pl);
  }

  return { polesIM, headsIM, glows, keyLights, intensity: 0 };
}

// ── PHT time → lamp intensity 0..1 ───────────────────────────────────────────

function targetIntensity(): number {
  const hm = getPHTHoursDecimal();
  if (hm >= 18.5 || hm < 5.5)  return 1.0;
  if (hm >= 17.5 && hm < 18.5) return hm - 17.5;
  if (hm >= 5.5  && hm < 6.5)  return 1.0 - (hm - 5.5);
  return 0;
}

let _checkAt = 0;
let _target  = targetIntensity();

export function updateStreetLamps(sys: LampSystem, t: number, delta: number): void {
  const sim = isSimulating();
  if (sim || t - _checkAt > 2.0) {
    _target  = targetIntensity();
    _checkAt = t;
  }

  sys.intensity = sim
    ? _target
    : sys.intensity + (_target - sys.intensity) * Math.min(1, delta * 1.2);
  const iv = sys.intensity;

  // Single material update → all lamp heads change at once
  _matHead.emissiveIntensity = iv * 5.5;

  // Glow sprites
  for (const sp of sys.glows) {
    (sp.material as THREE.SpriteMaterial).opacity = iv * 0.70;
  }

  // Key-area point lights
  for (const pl of sys.keyLights) {
    pl.intensity = iv * 2.2;
  }
}

export function disposeStreetLamps(sys: LampSystem): void {
  sys.polesIM.geometry.dispose();
  sys.polesIM.removeFromParent();
  sys.headsIM.geometry.dispose();
  sys.headsIM.removeFromParent();
  for (const sp of sys.glows) {
    (sp.material as THREE.SpriteMaterial).dispose();
    sp.removeFromParent();
  }
  for (const pl of sys.keyLights) pl.removeFromParent();
  _matPole.dispose();
  _matHead.dispose();
  _glowTex?.dispose();
  _glowTex = null;
  _glowMat?.dispose();
  _glowMat = null;
}
