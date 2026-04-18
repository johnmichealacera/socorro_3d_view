import * as THREE from "three";

// ─── Custom Realistic Water Shader ───────────────────────────────────────────

const VERT = /* glsl */ `
uniform float uTime;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;

float wave(float x, float z, float t, float freq, float amp, float speed) {
  return sin(x * freq + t * speed) * cos(z * freq * 0.7 - t * speed * 0.8) * amp;
}

void main() {
  vUv = uv;

  vec3 pos = position;

  // Gerstner-style layered waves
  pos.y += wave(pos.x, pos.z, uTime, 0.35, 0.12, 1.1);
  pos.y += wave(pos.x, pos.z, uTime, 0.65, 0.07, 0.85);
  pos.y += wave(pos.x, pos.z, uTime, 0.18, 0.18, 0.55);
  pos.y += wave(pos.x, pos.z, uTime, 1.20, 0.03, 2.20);

  vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;

  // Approximate normal from wave derivatives
  float eps = 0.02;
  float hL = wave(pos.x - eps, pos.z, uTime, 0.35, 0.12, 1.1)
           + wave(pos.x - eps, pos.z, uTime, 0.65, 0.07, 0.85)
           + wave(pos.x - eps, pos.z, uTime, 0.18, 0.18, 0.55)
           + wave(pos.x - eps, pos.z, uTime, 1.20, 0.03, 2.20);
  float hR = wave(pos.x + eps, pos.z, uTime, 0.35, 0.12, 1.1)
           + wave(pos.x + eps, pos.z, uTime, 0.65, 0.07, 0.85)
           + wave(pos.x + eps, pos.z, uTime, 0.18, 0.18, 0.55)
           + wave(pos.x + eps, pos.z, uTime, 1.20, 0.03, 2.20);
  float hD = wave(pos.x, pos.z - eps, uTime, 0.35, 0.12, 1.1)
           + wave(pos.x, pos.z - eps, uTime, 0.65, 0.07, 0.85)
           + wave(pos.x, pos.z - eps, uTime, 0.18, 0.18, 0.55)
           + wave(pos.x, pos.z - eps, uTime, 1.20, 0.03, 2.20);
  float hU = wave(pos.x, pos.z + eps, uTime, 0.35, 0.12, 1.1)
           + wave(pos.x, pos.z + eps, uTime, 0.65, 0.07, 0.85)
           + wave(pos.x, pos.z + eps, uTime, 0.18, 0.18, 0.55)
           + wave(pos.x, pos.z + eps, uTime, 1.20, 0.03, 2.20);

  vec3 norm = normalize(vec3(hL - hR, 2.0 * eps, hD - hU));
  vNormal = normalize(normalMatrix * norm);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform float uTime;
uniform vec3  uSunDirection;
uniform vec3  uCameraPosition;

// Sky color sampled at horizon — approximated for Philippines midday
const vec3 SKY_HORIZON = vec3(0.60, 0.78, 0.92);
const vec3 SKY_ZENITH  = vec3(0.18, 0.42, 0.72);

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;

// Animated micro-normal for surface ripple detail
vec3 microNormal(vec3 wp, float t) {
  float nx = sin(wp.x * 4.5 + t * 2.8) * 0.10
           + sin(wp.z * 3.2 - t * 2.0) * 0.08;
  float nz = cos(wp.x * 2.8 - t * 1.6) * 0.08
           + cos(wp.z * 5.0 + t * 3.2) * 0.06;
  return normalize(vec3(nx, 1.0, nz));
}

void main() {
  vec3 mn = microNormal(vWorldPos, uTime);
  vec3 N  = normalize(vNormal + vec3(mn.x * 0.35, 0.0, mn.z * 0.35));

  vec3 V = normalize(uCameraPosition - vWorldPos);

  // Fresnel – physical Schlick approximation
  float NdotV   = max(dot(N, V), 0.0);
  float fresnel0 = 0.04;                               // water F0
  float fresnel  = fresnel0 + (1.0 - fresnel0) * pow(1.0 - NdotV, 5.0);

  // Depth-based water color (turquoise near shore, deep blue offshore)
  // Shore is at x ≈ +30, ocean extends to +50+
  float t = clamp((vWorldPos.x - 28.0) / 22.0, 0.0, 1.0);
  vec3 shallowColor = vec3(0.28, 0.76, 0.80); // turquoise
  vec3 deepColor    = vec3(0.05, 0.20, 0.50); // deep blue
  vec3 waterColor   = mix(shallowColor, deepColor, t);

  // Reflection color: sky gradient
  vec3 R        = reflect(-V, N);
  float skyBlend = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 reflColor = mix(SKY_HORIZON, SKY_ZENITH, skyBlend);

  // Specular sun glitter
  vec3 H        = normalize(uSunDirection + V);
  float spec    = pow(max(dot(N, H), 0.0), 320.0) * 3.5;
  vec3 specColor = vec3(1.0, 0.97, 0.88) * spec;

  // Sub-surface scatter hint in shallow water
  float scatter = max(0.0, dot(uSunDirection, V)) * (1.0 - t) * 0.3;

  // Shore foam
  float foam = smoothstep(0.92, 1.0, 1.0 - t);
  foam *= abs(sin(vWorldPos.x * 6.0 + uTime * 2.5)) * 0.7;
  foam = clamp(foam, 0.0, 0.6);

  // Final composite
  vec3 col  = mix(waterColor + scatter, reflColor, fresnel * 0.7);
  col      += specColor;
  col       = mix(col, vec3(1.0), foam);

  // Alpha: deep water more transparent from above, opaque at grazing
  float alpha = mix(0.82, 0.96, fresnel);

  gl_FragColor = vec4(col, alpha);
}
`;

export interface WaterMesh extends THREE.Mesh {
  material: THREE.ShaderMaterial;
}

export function createWater(scene: THREE.Scene, sunDirection: THREE.Vector3): WaterMesh {
  // Large plane — covers the whole eastern bay and beyond
  const geo = new THREE.PlaneGeometry(220, 220, 80, 80);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime:            { value: 0 },
      uSunDirection:    { value: sunDirection.clone() },
      uCameraPosition:  { value: new THREE.Vector3() },
    },
    transparent: true,
    side: THREE.FrontSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, mat) as WaterMesh;
  // Center the ocean to the east of the terrain
  mesh.position.set(80, -0.18, 0);
  mesh.name = "water";
  scene.add(mesh);
  return mesh;
}

export function updateWater(water: WaterMesh, time: number, cameraPos: THREE.Vector3): void {
  water.material.uniforms.uTime.value = time;
  water.material.uniforms.uCameraPosition.value.copy(cameraPos);
}
