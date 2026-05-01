import * as THREE from "three";

export interface DiscoveryDef {
  id:       string;
  name:     string;
  story:    string;
  icon:     string;
  position: [number, number, number];
  color:    string; // CSS hex color
}

export const DISCOVERIES: DiscoveryDef[] = [
  {
    id:    "fishing-net",
    name:  "Old Fishing Net",
    icon:  "🕸",
    story: "Woven by hand before the motors came, this net still carries the smell of salt and deep water. Three generations of the Bonghanoy family made their living pulling it through the bay at dawn.",
    position: [27, 0.4, 6],
    color: "#40c0e8",
  },
  {
    id:    "school-bell",
    name:  "The School Bell",
    icon:  "🔔",
    story: "This bell has rung the same call for forty years. Students from the mountain barangays walked hours through the hills to answer it. Some still do.",
    position: [-2, 2.8, 22],
    color: "#f0c040",
  },
  {
    id:    "market-lantern",
    name:  "Vendor's Lantern",
    icon:  "🏮",
    story: "Before electric light reached the town, this lantern guided vendors through the pre-dawn market. The smell of dried fish and woodsmoke still clings to its metal.",
    position: [13, 1.2, 4],
    color: "#ff8840",
  },
  {
    id:    "founding-stone",
    name:  "Founding Stone",
    icon:  "🪨",
    story: "Placed when Socorro was first recorded as an official municipality. The mason who carved it came by boat from Mainit, crossing the strait before the jetty was built.",
    position: [6, 0.4, -2],
    color: "#a0c860",
  },
  {
    id:    "tuba-jar",
    name:  "Tuba Clay Jar",
    icon:  "🏺",
    story: "At every fiesta and town gathering, the first tuba is poured here — not to drink, but as offering to the land. The soil beneath has absorbed decades of gratitude.",
    position: [2, 0.4, 2],
    color: "#c07030",
  },
  {
    id:    "anchor",
    name:  "The Old Anchor",
    icon:  "⚓",
    story: "Cast from iron before this port had a name. Ships have come and gone across decades — the anchor stays, holding memory to the seafloor just beyond the pier.",
    position: [24, 0.4, -2],
    color: "#607888",
  },

  // ── Phase 4: Folklore & Oral Traditions ──────────────────────────────────────
  {
    id:    "white-sand-legend",
    name:  "Legend of the White Sand",
    icon:  "🐚",
    story: "The elders say Puyangi's sand is white because it was carried piece by piece from the sea floor by the spirits of the coral. Every grain is a prayer — left by creatures who gave their bodies to the reef so the beach could exist. Do not take the sand home. It remembers where it came from.",
    position: [25, 0.4, 58],
    color: "#e0d0a0",
  },
  {
    id:    "sohoton-keeper",
    name:  "The Sohoton Keeper",
    icon:  "🪼",
    story: "Past the headland, beyond what maps mark, there is a cove where jellyfish live without stingers. The old fishermen say they are the souls of children who drowned there long ago — made gentle by the sea. You can swim among them if your heart is quiet. If it is not, they will know.",
    position: [20, 0.4, 50],
    color: "#80c8e8",
  },
  {
    id:    "fishermans-star",
    name:  "The Fisherman's Star",
    icon:  "⭐",
    story: "Long before GPS, every fisherman from Socorro learned to find the same star — low on the horizon, slightly east of south. A grandfather would take his grandson to the pier before dawn and point. 'That star,' he would say, 'is always there. When you are lost, find that.' Several of those grandsons still fish these waters.",
    position: [22, 0.4, 10],
    color: "#ffd080",
  },
  {
    id:    "bell-that-rang",
    name:  "The Bell That Rang Alone",
    icon:  "🔔",
    story: "During the great typhoon of 1984, when the wind had taken the power lines and the streets were rivers, the church bell rang at 3 in the morning. No one could reach it. No one was there. Those who sheltered in the church that night say it rang exactly twelve times, slowly, like a count. By morning the storm had passed. The priest wrote in his journal: 'I do not know what rang it. I am grateful.'",
    position: [-6, 1.0, -8],
    color: "#c0a060",
  },
];

export interface DiscoveryObject {
  def:   DiscoveryDef;
  group: THREE.Group;
  orb:   THREE.Mesh;
  ring:  THREE.Mesh;
}

export function createDiscoveries(scene: THREE.Scene): DiscoveryObject[] {
  const objects: DiscoveryObject[] = [];

  for (const def of DISCOVERIES) {
    const group = new THREE.Group();
    group.position.set(def.position[0], def.position[1], def.position[2]);
    group.userData.isDiscovery = true;

    // Glowing orb
    const orbGeo = new THREE.SphereGeometry(0.18, 10, 7);
    const orbMat = new THREE.MeshStandardMaterial({
      color:            new THREE.Color(def.color),
      emissive:         new THREE.Color(def.color),
      emissiveIntensity: 1.2,
      transparent:      true,
      opacity:          0.92,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.name = "discoveryOrb";
    orb.userData.discoveryId = def.id;
    group.add(orb);

    // Ground pulse ring
    const ringGeo = new THREE.TorusGeometry(0.35, 0.028, 6, 32);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color:      new THREE.Color(def.color),
      transparent: true,
      opacity:    0.45,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = -def.position[1] + 0.05; // keep flat on ground regardless of orb y
    group.add(ring);

    // Subtle point light
    const light = new THREE.PointLight(new THREE.Color(def.color), 0.5, 2.5);
    group.add(light);

    scene.add(group);
    objects.push({ def, group, orb, ring });
  }

  return objects;
}

export function updateDiscoveries(
  objects:    DiscoveryObject[],
  t:          number,
  selectedId: string | null
): void {
  for (const obj of objects) {
    const isSel  = selectedId === obj.def.id;
    const floatY = 0.1 + Math.sin(t * 1.6 + obj.def.position[0]) * 0.09;
    obj.orb.position.y = floatY;

    const pulse = isSel ? 1.5 : 1 + Math.sin(t * 2.2 + obj.def.position[2]) * 0.14;
    obj.orb.scale.setScalar(pulse);

    const mat = obj.orb.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = isSel ? 2.8 : 0.9 + Math.sin(t * 2.0) * 0.35;

    obj.ring.rotation.y = t * 0.8;
    (obj.ring.material as THREE.MeshBasicMaterial).opacity =
      0.25 + Math.sin(t * 1.4 + obj.def.position[0]) * 0.18;
    obj.ring.scale.setScalar(1 + Math.sin(t * 1.1) * 0.12);
  }
}

export function disposeDiscoveries(objects: DiscoveryObject[]): void {
  for (const obj of objects) {
    obj.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
    obj.group.removeFromParent();
  }
}
