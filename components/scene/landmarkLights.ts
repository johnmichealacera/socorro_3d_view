/**
 * Landmark lighting — per-building PointLights + window glow sprites.
 *
 * Lights activate at dusk (same schedule as street lamps) and also boost
 * during bad weather (rain/storm) so landmarks are visible in daytime darkness.
 *
 * All window meshes share M.glass / M.glassDark from markers.ts.
 * Updating GLASS_MATS[*].emissiveIntensity changes every window at once.
 */
import * as THREE from "three";
import { BuildingGroup } from "./types";
import { GLASS_MATS } from "./markers";

// ── Window glow halo texture ──────────────────────────────────────────────────
// Soft white rectangle — simulates light spilling from a window row.

let _haloTex: THREE.CanvasTexture | null = null;
function getHaloTex(): THREE.CanvasTexture {
  if (_haloTex) return _haloTex;
  const W = 128, H = 64;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
  g.addColorStop(0.00, "rgba(255,255,255,1.00)");
  g.addColorStop(0.25, "rgba(230,245,255,0.70)");
  g.addColorStop(0.60, "rgba(200,230,255,0.25)");
  g.addColorStop(1.00, "rgba(180,220,255,0.00)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  _haloTex = new THREE.CanvasTexture(c);
  return _haloTex;
}

// ── Per-category light config ─────────────────────────────────────────────────

interface LightCfg {
  color:         number;   // main point light colour (white/near-white)
  intensity:     number;   // max intensity — main light
  distance:      number;   // main light radius (scene units)
  floodIntensity:number;   // secondary low flood light (illuminates surroundings)
  floodDistance: number;   // flood radius — wide, covers the area around the building
  yOffset:       number;   // height above building base
  halos:         { y: number; z: number; scale: number }[];
}

const WHITE  = 0xffffff;
const WWHITE = 0xf0f8ff;   // slightly cool white

const CFG: Record<string, LightCfg> = {
  government: {
    color: WHITE,  intensity: 8.0, distance: 22, floodIntensity: 3.5, floodDistance: 35,
    yOffset: 2.5,
    halos: [{ y: 0.55, z: 0.85, scale: 4.0 }, { y: 1.45, z: 0.78, scale: 3.5 }],
  },
  church: {
    color: WWHITE, intensity: 7.0, distance: 24, floodIntensity: 3.0, floodDistance: 38,
    yOffset: 3.2,
    halos: [{ y: 0.45, z: 1.65, scale: 4.0 }, { y: 1.55, z: 1.62, scale: 3.0 }, { y: 3.30, z: -1.15, scale: 2.5 }],
  },
  market: {
    color: WHITE,  intensity: 9.0, distance: 26, floodIntensity: 4.0, floodDistance: 40,
    yOffset: 2.0,
    halos: [{ y: 0.80, z: 2.10, scale: 6.5 }, { y: 0.80, z: -2.10, scale: 6.5 }],
  },
  port: {
    color: WHITE,  intensity: 8.5, distance: 28, floodIntensity: 4.0, floodDistance: 45,
    yOffset: 2.2,
    halos: [{ y: 0.90, z: 0.70, scale: 6.0 }, { y: 0.90, z: -5.0, scale: 4.5 }],
  },
  school: {
    color: WHITE,  intensity: 8.0, distance: 24, floodIntensity: 3.5, floodDistance: 38,
    yOffset: 2.5,
    halos: [{ y: 0.60, z: 0.68, scale: 5.5 }, { y: 1.50, z: 0.68, scale: 5.5 }],
  },
  plaza: {
    color: WHITE,  intensity: 7.5, distance: 28, floodIntensity: 4.0, floodDistance: 45,
    yOffset: 3.0,
    halos: [
      { y: 1.85, z: 0.0,  scale: 5.0 },
      { y: 0.45, z: 2.0,  scale: 3.5 },
      { y: 0.45, z: -2.0, scale: 3.5 },
    ],
  },
  hospital: {
    color: WWHITE, intensity: 8.5, distance: 22, floodIntensity: 3.5, floodDistance: 35,
    yOffset: 2.2,
    halos: [{ y: 0.82, z: 0.73, scale: 5.0 }, { y: 1.38, z: 0.73, scale: 4.5 }],
  },
  commercial: {
    color: WHITE,  intensity: 6.5, distance: 18, floodIntensity: 3.0, floodDistance: 28,
    yOffset: 1.6,
    halos: [{ y: 0.75, z: 0.70, scale: 4.0 }],
  },
  beach: {
    color: WHITE,  intensity: 6.0, distance: 22, floodIntensity: 3.0, floodDistance: 35,
    yOffset: 2.0,
    halos: [{ y: 0.80, z: -1.10, scale: 5.0 }, { y: 0.80, z: 1.20, scale: 4.0 }],
  },
  recreation: {
    color: WHITE,  intensity: 7.0, distance: 22, floodIntensity: 3.5, floodDistance: 38,
    yOffset: 2.0,
    halos: [{ y: 0.80, z: -2.55, scale: 5.0 }, { y: 0.80, z: 2.6, scale: 5.0 }],
  },
};

const DEFAULT_CFG: LightCfg = {
  color: WHITE, intensity: 6.0, distance: 18, floodIntensity: 2.8, floodDistance: 28,
  yOffset: 1.8,
  halos: [{ y: 0.75, z: 0.70, scale: 3.5 }],
};

// ── Public API ────────────────────────────────────────────────────────────────

export interface LandmarkLightSystem {
  entries:   { light: THREE.PointLight; flood: THREE.PointLight; halos: THREE.Sprite[]; cfg: LightCfg }[];
  intensity: number;
}

export function createLandmarkLights(
  scene:     THREE.Scene,
  buildings: BuildingGroup[],
): LandmarkLightSystem {
  const entries: LandmarkLightSystem["entries"] = [];
  const tex = getHaloTex();

  for (const bldg of buildings) {
    const loc = bldg.userData.location;
    const cfg = CFG[loc.category] ?? DEFAULT_CFG;
    const wx  = bldg.position.x;
    const wy  = bldg.userData.baseY;
    const wz  = bldg.position.z;

    // Main light — above building, illuminates the structure
    const light = new THREE.PointLight(cfg.color, 0, cfg.distance, 2.0);
    light.position.set(wx, wy + cfg.yOffset, wz);
    light.castShadow = false;
    scene.add(light);

    // Flood light — low to the ground, wide radius, illuminates surrounding area
    const flood = new THREE.PointLight(cfg.color, 0, cfg.floodDistance, 1.5);
    flood.position.set(wx, wy + 0.8, wz);
    flood.castShadow = false;
    scene.add(flood);

    // Window halo sprites
    const isPort = loc.category === "port";
    const halos: THREE.Sprite[] = [];

    for (const h of cfg.halos) {
      const mat = new THREE.SpriteMaterial({
        map:        tex,
        transparent: true,
        opacity:    0,
        blending:   THREE.AdditiveBlending,
        depthWrite: false,
        fog:        false,
      });
      const sp = new THREE.Sprite(mat);
      const hx = isPort ? -(h.z) : 0;
      const hz = isPort ?  0     : h.z;
      sp.position.set(wx + hx, wy + h.y, wz + hz);
      sp.scale.set(h.scale, h.scale * 0.55, 1);
      scene.add(sp);
      halos.push(sp);
    }

    entries.push({ light, flood, halos, cfg });
  }

  return { entries, intensity: 0 };
}

// ── PHT time → lamp intensity ─────────────────────────────────────────────────

function nightIntensity(): number {
  const now  = new Date();
  const phtH = (now.getUTCHours() + 8) % 24;
  const phtM = now.getUTCMinutes();
  const hm   = phtH + phtM / 60;

  if (hm >= 18.5 || hm < 5.5)  return 1.0;
  if (hm >= 17.5 && hm < 18.5) return hm - 17.5;
  if (hm >= 5.5  && hm < 6.5)  return 1.0 - (hm - 5.5);
  return 0;
}

let _checkAt  = 0;
let _nightTgt = nightIntensity();

export function updateLandmarkLights(
  sys:          LandmarkLightSystem,
  t:            number,
  delta:        number,
  weatherSunMult: number,   // 0..1 — lower = darker weather, boosts lights
): void {
  if (t - _checkAt > 2.0) {
    _nightTgt = nightIntensity();
    _checkAt  = t;
  }

  // Weather darkness contributes light demand: storm (sunMult 0.09) → darkBoost ≈ 0.85
  const darkBoost = Math.max(0, 1.0 - weatherSunMult);
  // Weather boost is capped so daytime with light drizzle doesn't fully light up
  const weatherBoost = darkBoost * 0.88;

  const target = Math.max(_nightTgt, weatherBoost);
  sys.intensity += (target - sys.intensity) * Math.min(1, delta * 1.0);
  const iv = sys.intensity;

  // Animate each building's lights + halos
  for (const { light, flood, halos, cfg } of sys.entries) {
    light.intensity = iv * cfg.intensity;
    flood.intensity = iv * cfg.floodIntensity;
    const haloOp = iv * 0.92;
    for (const sp of halos) {
      (sp.material as THREE.SpriteMaterial).opacity = haloOp;
    }
  }

  // Shared glass emissive — all windows light up at once
  for (const gm of GLASS_MATS) {
    gm.emissiveIntensity = iv * 2.8;
  }
}

export function disposeLandmarkLights(sys: LandmarkLightSystem): void {
  for (const { light, flood, halos } of sys.entries) {
    light.removeFromParent();
    flood.removeFromParent();
    for (const sp of halos) {
      (sp.material as THREE.SpriteMaterial).dispose();
      sp.removeFromParent();
    }
  }
  _haloTex?.dispose();
  _haloTex = null;
  // Reset glass emissive on cleanup
  for (const gm of GLASS_MATS) gm.emissiveIntensity = 0;
}
