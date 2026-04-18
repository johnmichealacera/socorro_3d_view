import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export function createPostProcessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
): EffectComposer {
  const composer = new EffectComposer(renderer);

  // Base render
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Correct output color space
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
