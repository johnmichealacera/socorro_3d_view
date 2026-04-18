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

const SPRITE_W = 0.55;   // width  (~5.5 m — deliberately exaggerated for readability)
const SPRITE_H = 0.90;   // height (~9 m  — tall so visible from aerial view)
const LIFT     = 0.45;   // Y centre of sprite above terrain
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
  const geo = new THREE.CircleGeometry(0.28, 16);
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

// ─── NPC data ─────────────────────────────────────────────────────────────────

export interface NPCData {
  sprite:       THREE.Sprite;
  disc:         THREE.Mesh;
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
}

// ─── Per-category config ──────────────────────────────────────────────────────

function npcCount(cat: string): number {
  return cat === "school" ? 6 : cat === "plaza" ? 5 :
         cat === "market" ? 4 : cat === "port"  ? 3 :
         cat === "church" ? 3 : 2;
}

function wanderR(cat: string): number {
  return cat === "school" ? 5.0 : cat === "plaza" ? 4.5 :
         cat === "market" ? 3.5 : cat === "port"  ? 3.0 : 2.0;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function createNPCs(
  scene:     THREE.Scene,
  buildings: BuildingGroup[]
): NPCData[] {
  const npcs: NPCData[] = [];

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

      scene.add(sprite);
      scene.add(disc);

      npcs.push({
        sprite,
        disc,
        homeX:        bx,
        homeZ:        bz,
        wanderRadius: wr,
        targetX:      sx,
        targetZ:      sz,
        speed:        0.10 + rng() * 0.06,  // 0.10–0.16 units/s ≈ 1–1.6 m/s
        idleTimer:    rng() * 4.0,
        isIdle:       true,
        bobPhase:     rng() * Math.PI * 2,
        groundY:      sy,
        facingRight:  rng() > 0.5,
      });
    }
  }

  return npcs;
}

export function updateNPCs(npcs: NPCData[], t: number, delta: number): void {
  for (const npc of npcs) {
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
