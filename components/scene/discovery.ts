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
