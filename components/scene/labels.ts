import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { LocationData } from "./types";
import { CATEGORY_ICONS } from "./locations";

export function createLabelRenderer(): CSS2DRenderer {
  const renderer = new CSS2DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.top = "0";
  renderer.domElement.style.left = "0";
  renderer.domElement.style.pointerEvents = "none";
  renderer.domElement.style.zIndex = "10";
  document.body.appendChild(renderer.domElement);
  return renderer;
}

export function disposeLabelRenderer(labelRenderer: CSS2DRenderer): void {
  if (labelRenderer.domElement.parentElement) {
    labelRenderer.domElement.parentElement.removeChild(labelRenderer.domElement);
  }
}

export function resizeLabelRenderer(labelRenderer: CSS2DRenderer): void {
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

export function attachLabel(
  parent: THREE.Object3D,
  loc: LocationData,
  height: number
): CSS2DObject {
  const div = document.createElement("div");
  div.style.cssText = `
    display: flex;
    align-items: center;
    gap: 5px;
    background: rgba(8, 16, 32, 0.82);
    backdrop-filter: blur(8px);
    color: #e8f4ff;
    padding: 4px 10px 4px 7px;
    border-radius: 16px;
    font-size: 11px;
    font-weight: 600;
    font-family: -apple-system, 'Segoe UI', sans-serif;
    white-space: nowrap;
    border: 1px solid ${loc.color}55;
    box-shadow: 0 2px 8px rgba(0,0,0,0.55), 0 0 0 1px ${loc.color}22;
    letter-spacing: 0.01em;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    pointer-events: auto;
  `;

  const icon = document.createElement("span");
  icon.style.fontSize = "13px";
  icon.textContent = CATEGORY_ICONS[loc.category];

  const text = document.createElement("span");
  text.textContent = loc.name;
  text.style.color = "#f0f8ff";

  div.appendChild(icon);
  div.appendChild(text);

  div.addEventListener("mouseenter", () => {
    div.style.background = `rgba(${hexToRgb(loc.color)}, 0.25)`;
    div.style.borderColor = loc.color;
  });
  div.addEventListener("mouseleave", () => {
    div.style.background = "rgba(8, 16, 32, 0.82)";
    div.style.borderColor = `${loc.color}55`;
  });

  const label = new CSS2DObject(div);
  label.position.set(0, height, 0);
  label.name = "label";
  parent.add(label);
  return label;
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
