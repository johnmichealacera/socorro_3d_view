import * as THREE from "three";

const DROP_COUNT  = 1800;
const DROP_LEN    = 0.50; // visual length of each raindrop
const RAIN_RADIUS = 28;   // horizontal spawn radius around camera
const RAIN_TOP    = 20;   // Y spawn height
const RAIN_BOTTOM = -1;   // Y reset threshold

export interface RainSystem {
  lines:     THREE.LineSegments;
  positions: Float32Array;
  speeds:    Float32Array;
  active:    boolean;
}

export function createRain(scene: THREE.Scene): RainSystem {
  const positions = new Float32Array(DROP_COUNT * 6); // 2 vertices × 3 coords per drop
  const speeds    = new Float32Array(DROP_COUNT);

  for (let i = 0; i < DROP_COUNT; i++) {
    const x = (Math.random() - 0.5) * RAIN_RADIUS * 2;
    const y = Math.random() * (RAIN_TOP + 4);
    const z = (Math.random() - 0.5) * RAIN_RADIUS * 2;
    positions[i * 6 + 0] = x;
    positions[i * 6 + 1] = y;
    positions[i * 6 + 2] = z;
    positions[i * 6 + 3] = x;
    positions[i * 6 + 4] = y - DROP_LEN;
    positions[i * 6 + 5] = z;
    speeds[i] = 12 + Math.random() * 8;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.LineBasicMaterial({
    color: 0x9ac8e0,
    transparent: true,
    opacity: 0,
  });

  const lines = new THREE.LineSegments(geo, mat);
  lines.name = "rain";
  lines.frustumCulled = false;
  scene.add(lines);

  return { lines, positions, speeds, active: false };
}

export function setRaining(sys: RainSystem, raining: boolean): void {
  sys.active = raining;
}

export function updateRain(
  sys:    RainSystem,
  delta:  number,
  camPos: THREE.Vector3
): void {
  const mat = sys.lines.material as THREE.LineBasicMaterial;
  const targetOpacity = sys.active ? 0.40 : 0.0;
  mat.opacity += (targetOpacity - mat.opacity) * 0.06;

  if (mat.opacity < 0.01) return;

  const posAttr = sys.lines.geometry.getAttribute("position") as THREE.BufferAttribute;

  for (let i = 0; i < DROP_COUNT; i++) {
    const fall = sys.speeds[i] * delta;
    sys.positions[i * 6 + 1] -= fall;
    sys.positions[i * 6 + 4] -= fall;

    if (sys.positions[i * 6 + 4] < RAIN_BOTTOM) {
      const x = camPos.x + (Math.random() - 0.5) * RAIN_RADIUS * 2;
      const y = RAIN_TOP + Math.random() * 4;
      const z = camPos.z + (Math.random() - 0.5) * RAIN_RADIUS * 2;
      sys.positions[i * 6 + 0] = x;
      sys.positions[i * 6 + 1] = y;
      sys.positions[i * 6 + 2] = z;
      sys.positions[i * 6 + 3] = x;
      sys.positions[i * 6 + 4] = y - DROP_LEN;
      sys.positions[i * 6 + 5] = z;
    }
  }

  posAttr.array.set(sys.positions);
  posAttr.needsUpdate = true;
}

export function disposeRain(sys: RainSystem): void {
  sys.lines.geometry.dispose();
  (sys.lines.material as THREE.LineBasicMaterial).dispose();
  sys.lines.removeFromParent();
}
