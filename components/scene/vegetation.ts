import * as THREE from "three";
import { terrainHeight } from "./terrain";

// ─── Materials ────────────────────────────────────────────────────────────────

const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x7a5530, roughness: 0.96, metalness: 0 });
const palmLeafMat  = new THREE.MeshStandardMaterial({ color: 0x2a6820, roughness: 0.90, metalness: 0, side: THREE.DoubleSide });
const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.98, metalness: 0 });
const treeLeafMat  = new THREE.MeshStandardMaterial({ color: 0x1e5018, roughness: 0.92, metalness: 0 });
const hillTreeMat  = new THREE.MeshStandardMaterial({ color: 0x163a12, roughness: 0.94, metalness: 0 });

// ─── Palm tree (Cocos nucifera – Philippine coconut palm) ─────────────────────

function createPalmTree(scale = 1.0): THREE.Group {
  const g = new THREE.Group();

  // Slightly curved trunk (approximated with segments)
  const SEGS = 5;
  const totalH = 2.8 * scale;
  let prevY = 0;
  let prevX = 0;
  for (let i = 0; i < SEGS; i++) {
    const t = i / SEGS;
    const r = (0.075 - t * 0.035) * scale;
    const segH = totalH / SEGS;
    const lean = Math.sin(t * Math.PI * 0.5) * 0.35 * scale;
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 0.85, r, segH, 7),
      palmTrunkMat
    );
    seg.castShadow = true;
    seg.position.set(prevX + lean * 0.05, prevY + segH * 0.5, 0);
    g.add(seg);
    prevY += segH;
    prevX += lean * 0.05;
  }

  // Fronds (8 curved leaves)
  const frondCount = 8;
  for (let i = 0; i < frondCount; i++) {
    const angle = (i / frondCount) * Math.PI * 2;
    const frond = new THREE.Group();
    // Each frond is several elongated planes
    for (let j = 0; j < 3; j++) {
      const seg = new THREE.Mesh(
        new THREE.PlaneGeometry(0.12 * scale, 0.7 * scale),
        palmLeafMat
      );
      seg.castShadow = true;
      seg.position.set(j * 0.3 * scale, -j * 0.06 * scale, 0);
      seg.rotation.z = j * 0.15;
      frond.add(seg);
    }
    frond.rotation.y = angle;
    frond.rotation.z = Math.PI * 0.38; // droop outward
    frond.position.set(prevX, prevY, 0);
    g.add(frond);
  }

  return g;
}

// ─── Generic tropical broadleaf tree ─────────────────────────────────────────

function createTree(scale = 1.0, mat1 = treeLeafMat): THREE.Group {
  const g = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04 * scale, 0.07 * scale, 0.7 * scale, 6),
    treeTrunkMat
  );
  trunk.castShadow = true;
  trunk.position.y = 0.35 * scale;
  g.add(trunk);

  // Layered canopy
  const layers = 3;
  for (let l = 0; l < layers; l++) {
    const r = (0.42 - l * 0.06) * scale;
    const h = (0.38 - l * 0.05) * scale;
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), mat1);
    canopy.castShadow = true;
    canopy.position.y = (0.68 + l * 0.28) * scale;
    g.add(canopy);
  }
  return g;
}

// ─── Placement data ───────────────────────────────────────────────────────────

interface TreeSpec {
  x: number; z: number;
  type: "palm" | "tree" | "hill";
  scale: number;
  rotY: number;
}

const TREE_SPECS: TreeSpec[] = [
  // ── Palm trees along the coastal flat and inland edge ──────────────────
  { x: -3,  z: -9,  type:"palm",  scale:1.1, rotY:0.4  },
  { x: -5,  z:  2,  type:"palm",  scale:1.2, rotY:1.1  },
  { x: -4,  z: 10,  type:"palm",  scale:1.0, rotY:2.3  },
  { x:  3,  z:-10,  type:"palm",  scale:0.9, rotY:0.8  },
  { x:  7,  z: -6,  type:"palm",  scale:1.0, rotY:1.6  },
  { x: 10,  z:  0,  type:"palm",  scale:1.1, rotY:3.1  },
  { x: 13,  z:-10,  type:"palm",  scale:0.85,rotY:0.2  },
  { x: 12,  z: 10,  type:"palm",  scale:1.0, rotY:2.7  },
  { x: 15,  z: -4,  type:"palm",  scale:0.9, rotY:1.4  },
  { x: 16,  z: 14,  type:"palm",  scale:1.1, rotY:0.7  },
  { x:  6,  z: 18,  type:"palm",  scale:0.95,rotY:2.0  },
  { x: -1,  z: 26,  type:"palm",  scale:1.0, rotY:1.3  },
  { x: 14,  z:-18,  type:"palm",  scale:0.85,rotY:3.4  },
  { x: -6,  z:-18,  type:"palm",  scale:1.1, rotY:0.9  },
  { x:  3,  z: 30,  type:"palm",  scale:0.9, rotY:2.5  },
  // ── Broadleaf trees in town ────────────────────────────────────────────
  { x: -7,  z:  5,  type:"tree",  scale:1.0, rotY:0.5  },
  { x: -8,  z:-12,  type:"tree",  scale:1.2, rotY:2.1  },
  { x:  9,  z:  9,  type:"tree",  scale:0.9, rotY:0.3  },
  { x: -2,  z:-22,  type:"tree",  scale:1.1, rotY:1.7  },
  { x: 11,  z:-18,  type:"tree",  scale:0.95,rotY:3.0  },
  { x:  4,  z: 28,  type:"tree",  scale:1.0, rotY:1.2  },
  { x: 12,  z: 26,  type:"tree",  scale:0.9, rotY:0.8  },
  // ── Dense hill trees (west side) ──────────────────────────────────────
  { x:-12,  z:  0,  type:"hill",  scale:1.2, rotY:0.3  },
  { x:-15,  z:  8,  type:"hill",  scale:1.4, rotY:1.8  },
  { x:-18,  z: -5,  type:"hill",  scale:1.3, rotY:2.6  },
  { x:-20,  z: 12,  type:"hill",  scale:1.1, rotY:0.6  },
  { x:-22,  z: -8,  type:"hill",  scale:1.5, rotY:3.1  },
  { x:-25,  z:  2,  type:"hill",  scale:1.3, rotY:1.4  },
  { x:-28,  z:-12,  type:"hill",  scale:1.2, rotY:2.0  },
  { x:-30,  z: 18,  type:"hill",  scale:1.6, rotY:0.8  },
  { x:-14,  z:-20,  type:"hill",  scale:1.2, rotY:1.5  },
  { x:-10,  z: 20,  type:"hill",  scale:1.1, rotY:2.8  },
  { x:-16,  z:-15,  type:"hill",  scale:1.3, rotY:0.4  },
  { x:-24,  z: -3,  type:"hill",  scale:1.4, rotY:3.3  },
  { x:-19,  z:-22,  type:"hill",  scale:1.2, rotY:1.9  },
  { x:-32,  z:  5,  type:"hill",  scale:1.5, rotY:0.7  },
  { x:-35,  z:-10,  type:"hill",  scale:1.6, rotY:2.2  },
  { x:-38,  z: 14,  type:"hill",  scale:1.4, rotY:1.0  },
];

export function createVegetation(scene: THREE.Scene): void {
  for (const spec of TREE_SPECS) {
    // Avoid placing inside major buildings (rough exclusion zones)
    if (Math.abs(spec.x) < 3.5 && Math.abs(spec.z) < 5) continue; // Hall
    if (spec.x > 22) continue; // in the bay

    const y = terrainHeight(spec.x, spec.z);
    if (y <= 0.02) continue; // skip submerged spots

    let tree: THREE.Group;
    if (spec.type === "palm") {
      tree = createPalmTree(spec.scale);
    } else if (spec.type === "hill") {
      tree = createTree(spec.scale, hillTreeMat);
    } else {
      tree = createTree(spec.scale);
    }

    tree.position.set(spec.x, y, spec.z);
    tree.rotation.y = spec.rotY;
    scene.add(tree);
  }
}
