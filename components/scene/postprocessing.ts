import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

export function createPostProcessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
): EffectComposer {
  const composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Subtle tropical bloom — use renderer's actual pixel size to avoid shader program errors
  const size = new THREE.Vector2();
  renderer.getSize(size);
  const bloom = new UnrealBloomPass(
    size,
    0.35,  // strength — keep it cinematic, not sci-fi
    0.60,  // radius
    0.78   // threshold — only the brightest highlights bloom
  );
  // composer.addPass(bloom);

  const output = new OutputPass();
  composer.addPass(output);

  return composer;
}

export function resizeComposer(
  composer: EffectComposer,
  width: number,
  height: number
): void {
  composer.setSize(width, height);
}
