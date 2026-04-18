import * as THREE from "three";

export interface LocationData {
  id: string;
  name: string;
  description: string;
  category: "government" | "market" | "port" | "school" | "church" | "plaza" | "hospital" | "commercial";
  /** [x, y, z] in scene units. 1 unit ≈ 10 m. Origin = Municipal Hall.
   *  East coast (bay) is +X, inland/hills are -X, North is -Z, South is +Z */
  position: [number, number, number];
  color: string;
  accentColor: string;
}

export interface BuildingGroup extends THREE.Group {
  userData: {
    location: LocationData;
    baseY: number;
    isBuilding: boolean;
  };
}
