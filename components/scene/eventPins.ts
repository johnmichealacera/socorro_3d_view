import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { ANNUAL_EVENTS, daysUntil, type SocorroEvent } from "./eventData";
import { LOCATIONS } from "./locations";
import { type BuildingGroup } from "./types";

// Show 3D pins for events within this many days.
const PIN_WINDOW = 60;

function makePinTexture(hex: string): THREE.CanvasTexture {
  const S = 64;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;

  // Soft radial glow
  const glow = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  glow.addColorStop(0.00, hex + "ff");
  glow.addColorStop(0.28, hex + "bb");
  glow.addColorStop(0.60, hex + "44");
  glow.addColorStop(1.00, hex + "00");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);

  // Bright white core
  const core = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.16);
  core.addColorStop(0.0, "#ffffff");
  core.addColorStop(0.7, hex + "cc");
  core.addColorStop(1.0, hex + "00");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S * 0.16, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(c);
}

export interface EventPinObject {
  event:   SocorroEvent;
  sprite:  THREE.Sprite;
  ring:    THREE.Mesh;
  label:   CSS2DObject;
  baseY:   number;   // sprite resting world-Y (animated around this)
  phase:   number;   // per-pin float phase offset
}

export function createEventPins(
  scene:     THREE.Scene,
  buildings: BuildingGroup[],
): EventPinObject[] {
  const pins: EventPinObject[] = [];

  for (const ev of ANNUAL_EVENTS) {
    const days = daysUntil(ev);
    if (days > PIN_WINDOW) continue;

    const loc  = LOCATIONS.find((l) => l.id === ev.locationId);
    if (!loc) continue;

    const bldg  = buildings.find((b) => b.userData.location.id === ev.locationId);
    const baseY = bldg ? bldg.userData.baseY : 0;
    const [lx, , lz] = loc.position;
    const spriteY = baseY + 5.2;

    // ── Glow sprite ─────────────────────────────────────────────────────────
    const tex = makePinTexture(ev.color);
    const mat = new THREE.SpriteMaterial({
      map:         tex,
      transparent: true,
      opacity:     0.92,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(2.8, 2.8, 1);
    sprite.position.set(lx, spriteY, lz);
    scene.add(sprite);

    // ── Ground pulse ring ────────────────────────────────────────────────────
    const ringGeo = new THREE.RingGeometry(0.6, 1.05, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color:       new THREE.Color(ev.color),
      transparent: true,
      opacity:     0.38,
      side:        THREE.DoubleSide,
      depthWrite:  false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(lx, baseY + 0.12, lz);
    scene.add(ring);

    // ── CSS2D label ──────────────────────────────────────────────────────────
    const daysText = days === 0 ? "TODAY" : days === 1 ? "Tomorrow" : `in ${days}d`;
    const div = document.createElement("div");
    div.style.cssText = [
      "pointer-events:none",
      "background:rgba(6,14,28,0.88)",
      `border:1px solid ${ev.color}55`,
      `border-left:3px solid ${ev.color}`,
      "border-radius:5px",
      "padding:3px 8px",
      "font-family:-apple-system,'Segoe UI',sans-serif",
      "font-size:10px",
      "font-weight:600",
      "color:#e8f4ff",
      "white-space:nowrap",
      "backdrop-filter:blur(8px)",
      "line-height:1.45",
    ].join(";");
    div.innerHTML =
      `<span style="color:${ev.color};margin-right:4px">●</span>${ev.title}` +
      `<span style="color:#5a8aaa;font-weight:400;margin-left:5px">${daysText}</span>`;

    const label = new CSS2DObject(div);
    label.position.set(lx, spriteY + 1.0, lz);
    scene.add(label);

    pins.push({ event: ev, sprite, ring, label, baseY: spriteY, phase: Math.random() * Math.PI * 2 });
  }

  return pins;
}

export function updateEventPins(pins: EventPinObject[], t: number): void {
  for (const pin of pins) {
    // Gentle float bob
    const bob = Math.sin(t * 1.1 + pin.phase) * 0.35;
    pin.sprite.position.y = pin.baseY + bob;
    pin.label.position.y  = pin.baseY + 1.0 + bob;

    // Pulsing ring: scale + opacity
    const pulse = 1.0 + 0.28 * Math.sin(t * 2.2 + pin.phase);
    pin.ring.scale.set(pulse, pulse, 1);
    (pin.ring.material as THREE.MeshBasicMaterial).opacity =
      0.30 + 0.15 * Math.sin(t * 2.2 + pin.phase + Math.PI / 2);
  }
}

export function disposeEventPins(pins: EventPinObject[]): void {
  for (const { sprite, ring, label } of pins) {
    (sprite.material as THREE.SpriteMaterial).map?.dispose();
    (sprite.material as THREE.SpriteMaterial).dispose();
    sprite.removeFromParent();
    ring.geometry.dispose();
    (ring.material as THREE.MeshBasicMaterial).dispose();
    ring.removeFromParent();
    label.removeFromParent();
  }
}
