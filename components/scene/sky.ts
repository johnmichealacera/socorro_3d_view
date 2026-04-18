import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";

export interface SkyResult {
  sky: Sky;
  sunDirection: THREE.Vector3;
}

/**
 * Creates a physically-based atmospheric sky matching the Philippines daytime.
 * Sun elevation ~62°, azimuth facing roughly southwest from the bay.
 */
export function createSky(scene: THREE.Scene, renderer: THREE.WebGLRenderer): SkyResult {
  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);

  const u = sky.material.uniforms;
  u["turbidity"].value = 0;          // zero atmospheric haze
  u["rayleigh"].value = 0.2;         // minimal scatter — crisp horizon, no horizon glow
  u["mieCoefficient"].value = 0.0;   // no Mie scatter whitening
  u["mieDirectionalG"].value = 0.9;

  // Sun angle: azimuth ≈ 210° (south-southwest), elevation ≈ 62°
  const phi   = THREE.MathUtils.degToRad(90 - 62);  // from zenith
  const theta = THREE.MathUtils.degToRad(210);        // azimuth

  const sunDirection = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
  u["sunPosition"].value.copy(sunDirection);

  // Bake sky to environment cube so PBR materials get sky reflections
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  // Use the sky as scene background
  scene.background = sky as unknown as THREE.Texture;

  pmrem.dispose();

  return { sky, sunDirection };
}
