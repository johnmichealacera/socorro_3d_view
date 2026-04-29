import * as THREE from "three";

export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  // No scene fog — FogExp2 covers the world at aerial zoom-out distances.
  // The Sky shader's Rayleigh scattering provides atmospheric horizon haze instead.
  scene.fog = null;
  return scene;
}

export function createCamera(width: number, height: number): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.5, 2000);
  // Aerial-oblique view showing the coastal town and bay
  camera.position.set(-25, 55, 65);
  camera.lookAt(0, 0, 0);
  return camera;
}

export function createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
    logarithmicDepthBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

/**
 * Creates the primary lights matching the Sky sun position.
 * Returns { sun, hemisphere } so the caller can update them after Sky is set up.
 */
export function createLights(scene: THREE.Scene): {
  sun: THREE.DirectionalLight;
  hemisphere: THREE.HemisphereLight;
} {
  // Sky hemisphere — warm sky above, green-brown ground below
  const hemisphere = new THREE.HemisphereLight(0xc2ddf5, 0x4a6e30, 0.7);
  scene.add(hemisphere);

  // Sun — matches the Sky shader sun position (set in sky.ts)
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.8);
  sun.position.set(40, 60, -20);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 4096;
  sun.shadow.mapSize.height = 4096;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 250;
  sun.shadow.camera.left = -100;
  sun.shadow.camera.right = 100;
  sun.shadow.camera.top = 100;
  sun.shadow.camera.bottom = -100;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  return { sun, hemisphere };
}
