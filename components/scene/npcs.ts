/**
 * NPC sprite system — idle pedestrians near each building.
 *
 * Each NPC has:
 *  - A THREE.Sprite billboard (camera-facing human figure)
 *  - A flat colored disc on the ground beneath them (visible from any angle)
 *
 * Scale: 1 scene unit ≈ 10 m.
 */
import * as THREE from "three";
import { BuildingGroup } from "./types";
import { terrainHeight } from "./terrain";
import { getPHTData as _getPHTData, isSimulating } from "./timeOverride";

// ─── Palette — vivid so they stand out from terrain ──────────────────────────

const SHIRTS = [
  "#ff2020", "#ff8800", "#ffdd00", "#22dd22",
  "#00aaff", "#cc44ff", "#ff44aa", "#ffffff",
  "#00ffcc", "#ff6600", "#44aaff", "#ffaa00",
];
const PANTS = [
  "#1a1a4a", "#222222", "#1a3a1a", "#4a3010",
  "#18182a", "#2a1a00", "#102030", "#3a2a10",
];
const SKINS  = ["#f0c090", "#d4a060", "#c07840", "#8b5020", "#f0d0a0"];
const HAIRS  = ["#100808", "#1e1008", "#080808", "#503018", "#c09020"];

// ─── Sprite dimensions (scene units) ─────────────────────────────────────────

const SPRITE_W = 0.70;   // width  — exaggerated for readability from aerial view
const SPRITE_H = 1.15;   // height — tall enough to be clearly visible
const LIFT     = 0.58;   // Y centre of sprite above terrain
const WATER_X  = 23;     // east clamp — don't walk into the bay
const rng      = () => Math.random();

function pick<T>(arr: T[]): T { return arr[Math.floor(rng() * arr.length)]; }

// ─── Texture factory ──────────────────────────────────────────────────────────
// 64×128 canvas, figure drawn with a black outline pass first then colour pass.

function makeNPCTexture(shirt: string, pants: string, skin: string, hair: string): THREE.CanvasTexture {
  const W = 64, H = 128;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;

  // ── helper: draw the whole figure outline in black (slightly expanded) ──
  const outline = "#000000";
  const OL = 3; // outline expansion in px

  // Outline — shoes
  ctx.fillStyle = outline;
  ctx.fillRect(16 - OL, 102 - OL, 13 + OL * 2, 10 + OL * 2);
  ctx.fillRect(35 - OL, 102 - OL, 13 + OL * 2, 10 + OL * 2);
  // Outline — legs
  ctx.fillRect(16 - OL, 64 - OL, 13 + OL * 2, 40 + OL * 2);
  ctx.fillRect(35 - OL, 64 - OL, 13 + OL * 2, 40 + OL * 2);
  // Outline — torso
  ctx.fillRect(13 - OL, 30 - OL, 38 + OL * 2, 36 + OL * 2);
  // Outline — arms
  ctx.fillRect(2 - OL,  32 - OL, 14 + OL * 2, 26 + OL * 2);
  ctx.fillRect(48 - OL, 32 - OL, 14 + OL * 2, 26 + OL * 2);
  // Outline — head
  ctx.beginPath(); ctx.arc(32, 14, 13 + OL, 0, Math.PI * 2); ctx.fill();

  // ── colour pass ──────────────────────────────────────────────────────────

  // Shoes
  ctx.fillStyle = "#1a0c06";
  ctx.fillRect(17, 103, 12, 9);
  ctx.fillRect(36, 103, 12, 9);

  // Pants / legs
  ctx.fillStyle = pants;
  ctx.fillRect(17, 65, 12, 39);
  ctx.fillRect(36, 65, 12, 39);

  // Shirt / torso
  ctx.fillStyle = shirt;
  ctx.fillRect(14, 31, 36, 34);

  // Arms
  ctx.fillStyle = shirt;
  ctx.fillRect(3,  33, 12, 24);
  ctx.fillRect(49, 33, 12, 24);

  // Hands
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(9,  57, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(55, 57, 6, 0, Math.PI * 2); ctx.fill();

  // Neck
  ctx.fillStyle = skin;
  ctx.fillRect(27, 19, 10, 13);

  // Head
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(32, 14, 12, 0, Math.PI * 2); ctx.fill();

  // Hair (top half arc)
  ctx.fillStyle = hair;
  ctx.beginPath(); ctx.arc(32, 9, 12, Math.PI, 0); ctx.fill();

  // Eyes — two small white squares with dark pupils
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(24, 13, 6, 5);
  ctx.fillRect(34, 13, 6, 5);
  ctx.fillStyle = "#0a0a18";
  ctx.beginPath(); ctx.arc(27, 15, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(37, 15, 2.5, 0, Math.PI * 2); ctx.fill();

  // Smile
  ctx.strokeStyle = "#8a4020";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(32, 17, 4, 0.1, Math.PI - 0.1);
  ctx.stroke();

  // Subtle drop-shadow beneath feet
  ctx.save();
  ctx.globalAlpha = 0.20;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(32, 120, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  return tex;
}

// ─── Ground disc ──────────────────────────────────────────────────────────────
// Flat coloured circle on the terrain — always visible from above.

function makeDisc(color: string): THREE.Mesh {
  const geo = new THREE.CircleGeometry(0.36, 12);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = "npcDisc";
  return mesh;
}

// ─── PHT helpers ─────────────────────────────────────────────────────────────

const getPHTData = _getPHTData;

function scheduledOpacity(category: string, hour: number, minute: number, dow: number): number {
  const hm = hour + minute / 60;
  if (hm < 5.5 || hm >= 21.5) return 0;
  switch (category) {
    case "school":
      if (hm >= 7   && hm < 15.5) return 1.0;  // classes in session
      if (hm >= 15.5 && hm < 17)  return 0.75; // dismissal crowd
      return 0;                                  // empty outside school hours
    case "church":
      if (dow === 0 && hm >= 6 && hm <= 12) return 1.0; // Sunday mass
      if (hm >= 5.5 && hm < 8)              return 0.80; // daily early mass
      return 0;                                            // empty otherwise
    case "market":
      if (hm >= 5.5 && hm < 10)  return 1.00; // morning rush
      if (hm >= 10  && hm < 13)  return 0.60; // midday taper
      if (hm >= 13  && hm < 17)  return 0.25; // slow afternoon
      return 0;
    case "port":
      if (hm >= 3.5 && hm < 7)   return 1.0;  // pre-dawn fishing departure
      if (hm >= 15  && hm < 19)  return 0.90; // afternoon catch return
      if (hm >= 7   && hm < 15)  return 0.20; // midday skeleton crew
      return 0;
    case "plaza":
      if (hm >= 16.5 && hm < 21) return 0.90; // evening social hour (peak)
      if (hm >= 6    && hm < 9)  return 0.40; // morning joggers
      return 0;                                 // empty rest of day
    case "government": case "hospital":
      if (hm >= 8  && hm < 12)  return 0.85; // morning work
      if (hm >= 13 && hm < 17)  return 0.70; // afternoon work
      return 0;
    case "commercial":
      if (hm >= 7  && hm < 10)  return 0.70; // morning shop rush
      if (hm >= 10 && hm < 12)  return 0.45; // mid-morning
      if (hm >= 14 && hm < 18)  return 0.50; // afternoon reopen after siesta
      if (hm >= 18 && hm < 21)  return 0.65; // evening peak
      return 0;                               // closed 12–14 siesta, overnight
    case "recreation":
      if (hm >= 8  && hm < 12)  return 0.80; // morning swim crowd
      if (hm >= 14 && hm < 18)  return 0.70; // afternoon swimmers
      return 0;
    case "beach":
      if (hm >= 5.5 && hm < 9)  return 0.75; // sunrise fishing / early bathers
      if (hm >= 14  && hm < 18) return 0.90; // afternoon beach crowd
      return 0;
    default:
      return 0;
  }
}

// ─── NPC data ─────────────────────────────────────────────────────────────────

export interface NPCData {
  sprite:       THREE.Sprite;
  disc:         THREE.Mesh;
  category:     string;
  homeX:        number;
  homeZ:        number;
  wanderRadius: number;
  targetX:      number;
  targetZ:      number;
  speed:        number;     // scene units / second
  idleTimer:    number;
  isIdle:       boolean;
  bobPhase:     number;
  groundY:      number;
  facingRight:  boolean;
  scheduleOpacity: number;  // current smoothed schedule opacity
}

// ─── Per-category config ──────────────────────────────────────────────────────

function npcCount(cat: string): number {
  switch (cat) {
    case "school":     return 24;  // large student body
    case "market":     return 22;  // busy marketplace crowd
    case "plaza":      return 18;  // public gathering space
    case "church":     return 18;  // congregation
    case "port":       return 15;  // fishing community
    case "government": return 10;  // staff + visitors
    case "recreation": return 10;  // visitors at pool/park
    case "beach":      return  8;
    default:           return  6;  // commercial / small shops
  }
}

function wanderR(cat: string): number {
  switch (cat) {
    case "school":     return 15;
    case "market":     return 10;
    case "plaza":      return 11;
    case "port":       return 12;
    case "church":     return  8;
    case "beach":      return 10;
    case "recreation": return  7;
    default:           return  5;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function createNPCs(
  scene:     THREE.Scene,
  buildings: BuildingGroup[]
): NPCData[] {
  const npcs: NPCData[] = [];
  // Compute correct initial opacity so NPCs start at the right schedule state
  const initPHT = getPHTData();

  for (const bldg of buildings) {
    const loc   = bldg.userData.location;
    const bx    = loc.position[0];
    const bz    = loc.position[2];
    const count = npcCount(loc.category);
    const wr    = wanderR(loc.category);

    for (let i = 0; i < count; i++) {
      const shirt = pick(SHIRTS);
      const pants = pick(PANTS);
      const skin  = pick(SKINS);
      const hair  = pick(HAIRS);

      // Sprite
      const tex = makeNPCTexture(shirt, pants, skin, hair);
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.05,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(SPRITE_W, SPRITE_H, 1);
      sprite.name = "npc";

      // Ground disc
      const disc = makeDisc(shirt);

      // Initial position — scattered in a ring around the building
      const angle = (i / count) * Math.PI * 2 + rng() * 0.9;
      const dist  = 1.2 + rng() * 2.0;
      const sx    = Math.min(WATER_X, bx + Math.cos(angle) * dist);
      const sz    = bz + Math.sin(angle) * dist;
      const sy    = Math.max(0, terrainHeight(sx, sz));

      sprite.position.set(sx, sy + LIFT, sz);
      disc.position.set(sx, sy + 0.02, sz);

      // Set initial opacity from schedule — no ramp-in delay on load
      const initOpacity = scheduledOpacity(loc.category, initPHT.hour, initPHT.minute, initPHT.dow);
      mat.opacity = initOpacity;
      sprite.visible = initOpacity > 0.12;
      disc.visible   = sprite.visible;

      scene.add(sprite);
      scene.add(disc);

      npcs.push({
        sprite,
        disc,
        category:     loc.category,
        homeX:        bx,
        homeZ:        bz,
        wanderRadius: wr,
        targetX:      sx,
        targetZ:      sz,
        speed:        0.10 + rng() * 0.06,
        idleTimer:    rng() * 4.0,
        isIdle:       true,
        bobPhase:     rng() * Math.PI * 2,
        groundY:      sy,
        facingRight:  rng() > 0.5,
        scheduleOpacity: initOpacity,
      });
    }
  }

  return npcs;
}

// Throttle schedule check to once per second
let _scheduleCheckAt = 0;
let _phtCache = getPHTData(); // initialize with real PHT, never use a fake default

export function updateNPCs(npcs: NPCData[], t: number, delta: number): void {
  const sim = isSimulating();
  if (sim || t - _scheduleCheckAt > 1.0) {
    _phtCache = getPHTData();
    _scheduleCheckAt = t;
  }
  const { hour, minute, dow } = _phtCache;

  for (const npc of npcs) {
    // Smooth schedule opacity
    const target = scheduledOpacity(npc.category, hour, minute, dow);
    npc.scheduleOpacity = sim
      ? target
      : npc.scheduleOpacity + (target - npc.scheduleOpacity) * 0.015;
    const mat = npc.sprite.material as THREE.SpriteMaterial;
    mat.opacity = npc.scheduleOpacity;
    (npc.disc.material as THREE.MeshBasicMaterial).opacity = npc.scheduleOpacity * 0.72;
    npc.sprite.visible = npc.scheduleOpacity > 0.12;
    npc.disc.visible   = npc.sprite.visible;
    if (npc.isIdle) {
      // Gentle breathing sway
      npc.sprite.position.y =
        npc.groundY + LIFT + Math.sin(t * 1.8 + npc.bobPhase) * 0.008;
      // Disc pulses slightly while idle (visible from above)
      const pulse = 0.28 + Math.sin(t * 2.2 + npc.bobPhase) * 0.04;
      npc.disc.scale.setScalar(pulse / 0.28);

      npc.idleTimer -= delta;
      if (npc.idleTimer <= 0) {
        const a     = rng() * Math.PI * 2;
        const d     = rng() * npc.wanderRadius;
        npc.targetX = Math.min(WATER_X, npc.homeX + Math.cos(a) * d);
        npc.targetZ = npc.homeZ + Math.sin(a) * d;
        npc.isIdle  = false;
        npc.facingRight = npc.targetX >= npc.sprite.position.x;
      }

    } else {
      const dx   = npc.targetX - npc.sprite.position.x;
      const dz   = npc.targetZ - npc.sprite.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.05) {
        npc.isIdle    = true;
        npc.idleTimer = 1.5 + rng() * 4.5;
        npc.disc.scale.setScalar(1);
      } else {
        const step = Math.min(npc.speed * delta, dist);
        const nx   = npc.sprite.position.x + (dx / dist) * step;
        const nz   = npc.sprite.position.z + (dz / dist) * step;
        const ny   = Math.max(0, terrainHeight(nx, nz));
        npc.groundY = ny;

        // Walking bob
        const bob = Math.abs(Math.sin(t * 7.5 + npc.bobPhase)) * 0.022;
        npc.sprite.position.set(nx, ny + LIFT + bob, nz);
        npc.disc.position.set(nx, ny + 0.02, nz);
        // Disc shrinks slightly while moving (motion cue)
        npc.disc.scale.setScalar(0.75);

        npc.facingRight = dx >= 0;
      }

      const aw = Math.abs(npc.sprite.scale.x);
      npc.sprite.scale.x = npc.facingRight ? aw : -aw;
    }
  }
}

export function disposeNPCs(npcs: NPCData[]): void {
  for (const npc of npcs) {
    (npc.sprite.material as THREE.SpriteMaterial).map?.dispose();
    npc.sprite.material.dispose();
    npc.sprite.geometry.dispose();
    (npc.disc.material as THREE.MeshBasicMaterial).dispose();
    npc.disc.geometry.dispose();
  }
}
