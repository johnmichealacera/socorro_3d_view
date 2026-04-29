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
  u["turbidity"].value       = 0;
  u["rayleigh"].value        = 0.2;
  u["mieCoefficient"].value  = 0.0;
  u["mieDirectionalG"].value = 0.9;

  // Sun angle: azimuth ≈ 210° (south-southwest), elevation ≈ 62°
  const phi   = THREE.MathUtils.degToRad(90 - 62);
  const theta = THREE.MathUtils.degToRad(210);

  const sunDirection = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
  u["sunPosition"].value.copy(sunDirection);

  // Use the Sky shader as the scene background (natural atmospheric gradient)
  scene.background = sky as unknown as THREE.Texture;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  pmrem.dispose();

  return { sky, sunDirection };
}
