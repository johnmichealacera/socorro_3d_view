import * as THREE from "three";
import { BuildingGroup } from "./types";

// ─── Building hover / selection animations ────────────────────────────────────

export function animateBuildings(
  buildings: BuildingGroup[],
  _time: number,
  hoveredId: string | null,
  selectedId: string | null
): void {
  for (const b of buildings) {
    const loc    = b.userData.location;
    const isHov  = hoveredId  === loc.id;
    const isSel  = selectedId === loc.id;

    // Selection ring
    const ring = b.getObjectByName("selectionRing") as THREE.Mesh | undefined;
    if (ring) {
      const mat = ring.material as THREE.MeshBasicMaterial;
      if (isSel) {
        mat.opacity = 0.75 + Math.sin(_time * 3.0) * 0.15;
        ring.rotation.y = _time * 1.2;
        ring.scale.setScalar(1 + Math.sin(_time * 2.5) * 0.04);
      } else if (isHov) {
        mat.opacity = 0.45;
        ring.rotation.y = _time * 0.6;
        ring.scale.setScalar(1.0);
      } else {
        mat.opacity = 0;
        ring.scale.setScalar(1.0);
      }
    }

    // Slight Y lift on hover/select
    const targetY = b.userData.baseY + (isSel ? 0.25 : isHov ? 0.10 : 0);
    b.position.y += (targetY - b.position.y) * 0.12;

    // Scale pop on select
    const targetScale = isSel ? 1.08 : isHov ? 1.04 : 1.0;
    const cs = b.scale.x;
    b.scale.setScalar(cs + (targetScale - cs) * 0.12);
  }
}

// ─── Camera fly-to ────────────────────────────────────────────────────────────

export interface CameraTarget {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
}

/**
 * Returns a camera position that frames the building nicely —
 * ground-level perspective looking at the structure.
 */
export function buildingCameraTarget(
  bx: number, by: number, bz: number,
  category: string
): CameraTarget {
  // Angle offset depends on category for variety
  const angles: Record<string, number> = {
    government: -0.55,
    church: 0.3,
    market: 0.0,
    port: -0.8,
    school: 0.5,
    beach: -0.7,
    recreation: 0.4,
  };
  const a = Math.PI * (angles[category] ?? 0);
  const dist = 14;
  const height = 7;

  return {
    position: new THREE.Vector3(
      bx + Math.cos(a) * dist,
      by + height,
      bz + Math.sin(a) * dist
    ),
    lookAt: new THREE.Vector3(bx, by + 0.8, bz),
  };
}

export function animateCameraTo(
  camera: THREE.PerspectiveCamera,
  controls: { target: THREE.Vector3 },
  target: CameraTarget
): void {
  camera.position.lerp(target.position, 0.045);
  controls.target.lerp(target.lookAt, 0.055);
}
