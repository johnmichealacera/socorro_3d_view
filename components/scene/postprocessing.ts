import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

// Objects on this layer receive bloom; everything else is unaffected.
export const BLOOM_LAYER = 1;

export interface PostProcessing {
  bloomComposer: EffectComposer;
  finalComposer: EffectComposer;
}

// Additive blend shader — overlays the bloom texture on top of the base render.
const MixShader = {
  uniforms: {
    baseTexture:  { value: null as THREE.Texture | null },
    bloomTexture: { value: null as THREE.Texture | null },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D baseTexture;
    uniform sampler2D bloomTexture;
    varying vec2 vUv;
    void main() {
      gl_FragColor = texture2D(baseTexture, vUv) + texture2D(bloomTexture, vUv);
    }
  `,
};

export function createPostProcessing(
  renderer: THREE.WebGLRenderer,
  scene:    THREE.Scene,
  camera:   THREE.PerspectiveCamera,
): PostProcessing {
  const size = new THREE.Vector2();
  renderer.getSize(size);

  // ── Bloom composer ────────────────────────────────────────────────────────
  // Renders only BLOOM_LAYER objects (sky background excluded by the caller
  // temporarily setting scene.background = null before bloomComposer.render()).
  const bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;

  const bloomRenderPass = new RenderPass(scene, camera);
  bloomRenderPass.clearColor = new THREE.Color(0, 0, 0);
  bloomRenderPass.clearAlpha = 0;
  bloomComposer.addPass(bloomRenderPass);

  const bloom = new UnrealBloomPass(
    size,
    0.65,  // strength
    0.45,  // radius — tighter than before; emissive glows stay local
    0.72,  // threshold — only truly bright emissive pixels bloom
  );
  bloomComposer.addPass(bloom);

  // ── Final composer ────────────────────────────────────────────────────────
  // Renders the full scene, then additively overlays the bloom texture.
  const finalComposer = new EffectComposer(renderer);

  const finalRenderPass = new RenderPass(scene, camera);
  finalComposer.addPass(finalRenderPass);

  const mixPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        baseTexture:  { value: null },
        bloomTexture: { value: bloomComposer.renderTarget2.texture },
      },
      vertexShader:   MixShader.vertexShader,
      fragmentShader: MixShader.fragmentShader,
      defines: {},
    }),
    "baseTexture",
  );
  mixPass.needsSwap = true;
  finalComposer.addPass(mixPass);

  const output = new OutputPass();
  finalComposer.addPass(output);

  return { bloomComposer, finalComposer };
}

export function resizeComposer(
  pp:     PostProcessing,
  width:  number,
  height: number,
): void {
  pp.bloomComposer.setSize(width, height);
  pp.finalComposer.setSize(width, height);
}
