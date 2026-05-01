import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

// Simulated visitor presence — wander between landmark positions.
// Represents the concept of multiplayer without requiring a backend.

const VISIT_POINTS: THREE.Vector3[] = [
  new THREE.Vector3( 8,  0.32,  -4),  // Municipal Hall
  new THREE.Vector3(-3,  0.32,  -4),  // Church
  new THREE.Vector3( 3,  0.32,  -4),  // Plaza
  new THREE.Vector3(15,  0.32,   6),  // Market
  new THREE.Vector3(26,  0.32,   4),  // Port
  new THREE.Vector3( 1,  0.32, -15),  // Elementary School
  new THREE.Vector3( 8,  0.32,  22),  // High School area
  new THREE.Vector3(12,  0.32,  25),  // Madhouse
  new THREE.Vector3( 0,  0.32,  40),  // Taruc Pool
  new THREE.Vector3(28,  0.32,  55),  // Puyangi Beach
];

const VISITOR_DEFS = [
  { name: "Ate Grace",    color: "#FF6B9D" },
  { name: "Kuya Rodel",  color: "#4ECDC4" },
  { name: "Lola Coring", color: "#A78BFA" },
  { name: "Bunso Kiko",  color: "#F59E0B" },
  { name: "Manong Ben",  color: "#34D399" },
];

function makeVisitorTex(hex: string): THREE.CanvasTexture {
  const S = 48;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;

  // Soft outer glow
  const glow = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  glow.addColorStop(0.0, hex + "88");
  glow.addColorStop(1.0, hex + "00");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);

  // Solid disc body
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S * 0.26, 0, Math.PI * 2);
  ctx.fillStyle = hex;
  ctx.fill();

  // White ring
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S * 0.26, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  return new THREE.CanvasTexture(c);
}

export interface VisitorData {
  name:       string;
  sprite:     THREE.Sprite;
  label:      CSS2DObject;
  pos:        THREE.Vector3;   // current world position (mutated each frame)
  target:     THREE.Vector3;   // current target visit point
  waitTimer:  number;          // seconds to dwell before moving on
  moveSpeed:  number;          // units / second
  phase:      number;          // bob phase offset
}

export function createVisitors(scene: THREE.Scene): VisitorData[] {
  const visitors: VisitorData[] = [];

  VISITOR_DEFS.forEach((def, i) => {
    // Stagger starting positions so visitors don't spawn on top of each other
    const start = VISIT_POINTS[i % VISIT_POINTS.length].clone();

    const mat = new THREE.SpriteMaterial({
      map:         makeVisitorTex(def.color),
      transparent: true,
      depthWrite:  false,
      opacity:     0.92,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.9, 0.9, 1);
    sprite.position.copy(start);
    scene.add(sprite);

    // Name label
    const div = document.createElement("div");
    div.style.cssText = [
      "pointer-events:none",
      "font-family:-apple-system,'Segoe UI',sans-serif",
      "font-size:9px",
      "font-weight:600",
      `color:${def.color}`,
      "text-shadow:0 1px 4px rgba(0,0,0,0.9),0 0 8px rgba(0,0,0,0.8)",
      "white-space:nowrap",
      "user-select:none",
    ].join(";");
    div.textContent = def.name;
    const label = new CSS2DObject(div);
    label.position.copy(start).setY(start.y + 0.8);
    scene.add(label);

    // Pick a different initial target so visitors spread out immediately
    const targetIdx = (i + 3) % VISIT_POINTS.length;

    visitors.push({
      name:      def.name,
      sprite,
      label,
      pos:       start.clone(),
      target:    VISIT_POINTS[targetIdx].clone(),
      waitTimer: Math.random() * 4,
      moveSpeed: 1.0 + Math.random() * 0.8,
      phase:     Math.random() * Math.PI * 2,
    });
  });

  return visitors;
}

const _dir = new THREE.Vector3();

export function updateVisitors(visitors: VisitorData[], t: number, delta: number): void {
  for (const v of visitors) {
    if (v.waitTimer > 0) {
      v.waitTimer -= delta;
    } else {
      // Move toward target
      _dir.subVectors(v.target, v.pos);
      const dist = _dir.length();

      if (dist < 0.25) {
        // Arrived — pick a new target and start dwelling
        const candidates = VISIT_POINTS.filter((p) => p !== v.target);
        v.target = candidates[Math.floor(Math.random() * candidates.length)].clone();
        v.waitTimer = 4 + Math.random() * 8;
      } else {
        _dir.normalize();
        const step = Math.min(v.moveSpeed * delta, dist);
        v.pos.addScaledVector(_dir, step);
      }
    }

    // Gentle vertical bob
    const bob = Math.sin(t * 1.8 + v.phase) * 0.06;
    v.sprite.position.set(v.pos.x, v.pos.y + bob, v.pos.z);
    v.label.position.set(v.pos.x, v.pos.y + 0.85 + bob, v.pos.z);
  }
}

export function disposeVisitors(visitors: VisitorData[]): void {
  for (const { sprite, label } of visitors) {
    (sprite.material as THREE.SpriteMaterial).map?.dispose();
    (sprite.material as THREE.SpriteMaterial).dispose();
    sprite.removeFromParent();
    label.removeFromParent();
  }
}
