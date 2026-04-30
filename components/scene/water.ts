import * as THREE from "three";
import { getPHTPhase, isSimulating } from "./timeOverride";

// ── PHT wave schedule ─────────────────────────────────────────────────────────
// Philippines trade-wind cycle: calm at night, moderate morning, peak ~3 PM.

function phtWaveBase(): number {
  const ph = getPHTPhase();
  // 0.25 = 6 AM, 0.50 = noon, ~0.63 = 3 PM peak trades, 0.75 = 6 PM
  if (ph < 0.22)  return 0.50;                                           // midnight→5:17 AM calm
  if (ph < 0.29)  return 0.50 + (ph - 0.22) / 0.07 * 0.30;             // 5:17→7 AM building
  if (ph < 0.46)  return 0.80;                                           // 7→11 AM morning swell
  if (ph < 0.63)  return 0.80 + (ph - 0.46) / 0.17 * 0.20;             // 11 AM→3 PM rising
  if (ph < 0.71)  return 1.00;                                           // 3→5 PM peak trade winds
  if (ph < 0.81)  return 1.00 - (ph - 0.71) / 0.10 * 0.40;             // 5→7:26 PM subsiding
  if (ph < 0.88)  return 0.60;                                           // 7:26→9 PM evening calm
  return 0.50;                                                            // night calm
}

let _amp        = phtWaveBase();
let _ampCheckAt = 0;

function smoothedWaveAmp(t: number, weatherMult: number): number {
  const sim = isSimulating();
  if (sim || t - _ampCheckAt > 2.0) {
    _ampCheckAt = t;
    const target = phtWaveBase();
    _amp = sim ? target : _amp + (target - _amp) * 0.04;
  }
  return _amp * weatherMult;
}

// ── Vertex shader ─────────────────────────────────────────────────────────────
// True Gerstner waves: horizontal + vertical displacement, peaked crests.
// 5 wave trains from ENE/ESE/E (open Philippine Sea) toward the western shore.

const VERT = /* glsl */`
uniform float uTime;
uniform float uWaveAmp;

varying vec3  vWorldPos;
varying vec3  vGerstnerNormal;
varying vec2  vUv;

// Accumulates one Gerstner wave train into displacement and analytical normal.
// All amplitudes are pre-scaled by uWaveAmp externally via the amp parameter.
void addWave(
  vec2  baseXZ,
  float dx, float dz,          // pre-normalised propagation direction
  float amp, float freq,
  float speed, float steep,    // steep = Q factor (0 = sinusoidal, 1 = peaked)
  inout vec3 disp,
  inout vec3 norm
) {
  float a      = amp * uWaveAmp;
  float theta  = freq * (dx * baseXZ.x + dz * baseXZ.y) - speed * uTime;
  float sinT   = sin(theta);
  float cosT   = cos(theta);
  float wa     = freq * a;

  // Gerstner displacement: horizontal + vertical
  disp.x += steep * a * dx * cosT;
  disp.z += steep * a * dz * cosT;
  disp.y += a * sinT;

  // Analytical surface normal contribution
  norm.x -= wa * dx * cosT;
  norm.z -= wa * dz * cosT;
  norm.y -= steep * wa * sinT;
}

void main() {
  vUv = uv;
  vec3 pos  = position;
  vec3 disp = vec3(0.0);
  vec3 norm = vec3(0.0, 1.0, 0.0);

  // 5 wave trains — all heading westward (toward shore at x ≈ -50 in local space).
  // dir(x,z) are pre-normalised unit vectors.
  //                    dx       dz      amp    freq   spd   steep
  addWave(pos.xz,  -0.9397,  0.3420,  0.140, 0.310, 1.10, 0.65, disp, norm);  // WNW swell
  addWave(pos.xz,  -0.9397, -0.3420,  0.095, 0.500, 0.92, 0.52, disp, norm);  // WSW swell
  addWave(pos.xz,  -1.0000,  0.0000,  0.115, 0.210, 1.30, 0.68, disp, norm);  // due W swell
  addWave(pos.xz,  -0.7071,  0.7071,  0.048, 0.860, 0.70, 0.38, disp, norm);  // NW cross-swell
  addWave(pos.xz,  -0.8660, -0.5000,  0.030, 1.620, 2.15, 0.24, disp, norm);  // WSW high-freq chop

  pos += disp;

  vWorldPos      = (modelMatrix * vec4(pos, 1.0)).xyz;
  vGerstnerNormal = normalize(norm);
  vUv             = uv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

// ── Fragment shader ───────────────────────────────────────────────────────────

const FRAG = /* glsl */`
uniform float uTime;
uniform float uWaveAmp;
uniform vec3  uSunDirection;
uniform vec3  uCameraPosition;
uniform vec3  uSkyHorizon;     // dayCycle fog colour — sky at horizon
uniform vec3  uSkyZenith;      // dayCycle hemi sky colour — sky overhead

varying vec3  vWorldPos;
varying vec3  vGerstnerNormal; // Gerstner-only normal (no micro detail)
varying vec2  vUv;

// High-frequency surface ripple detail — layered sinusoids in world space.
vec3 microNormal(vec3 wp, float t) {
  float nx = sin(wp.x * 5.5 + t * 2.7) * 0.085
           + sin(wp.z * 3.8 - t * 1.8) * 0.065
           + sin((wp.x - wp.z) * 4.2 + t * 3.2) * 0.045;
  float nz = cos(wp.x * 3.2 - t * 1.6) * 0.065
           + cos(wp.z * 5.8 + t * 3.0) * 0.055
           + cos((wp.x + wp.z) * 3.0 - t * 2.1) * 0.035;
  return normalize(vec3(nx, 1.0, nz));
}

void main() {
  // Composite surface normal: Gerstner macro + micro ripple
  vec3 mn = microNormal(vWorldPos, uTime);
  vec3 N  = normalize(vGerstnerNormal + vec3(mn.x * 0.30, 0.0, mn.z * 0.30));

  vec3  V      = normalize(uCameraPosition - vWorldPos);
  float NdotV  = max(dot(N, V), 0.0);

  // ── Fresnel (Schlick, F0 = 0.04 for water) ────────────────────────────
  float fresnel = 0.04 + 0.96 * pow(1.0 - NdotV, 5.0);

  // ── Sky reflection ─────────────────────────────────────────────────────
  vec3  R        = reflect(-V, N);
  float skyBlend = clamp(R.y * 0.55 + 0.55, 0.0, 1.0);
  vec3  reflColor = mix(uSkyHorizon, uSkyZenith, skyBlend);

  // Below-horizon reflection: deep refraction tint (ambient light filtered through water)
  if (R.y < 0.0) {
    float belowT = clamp(-R.y * 2.5, 0.0, 1.0);
    reflColor = mix(reflColor, uSkyHorizon * 0.30, belowT);
  }

  // ── Water body colour (depth-based) ───────────────────────────────────
  // vWorldPos.x: shore ≈ 26, open water ≈ 54+  (world space, plane at x=80)
  float depth = clamp((vWorldPos.x - 26.0) / 30.0, 0.0, 1.0);

  // Sun elevation (0 = below horizon, 1 = noon) — drives day/night tint
  float sunElev = max(0.0, uSunDirection.y);

  vec3 shallowDay = vec3(0.24, 0.72, 0.80);   // clear turquoise
  vec3 deepDay    = vec3(0.04, 0.16, 0.46);   // deep Pacific blue
  vec3 nightShade = vec3(0.02, 0.04, 0.14);   // near-black night water

  vec3 waterDay   = mix(shallowDay, deepDay, depth);
  vec3 waterColor = mix(nightShade, waterDay, sunElev * 0.88 + 0.12);

  // Sub-surface scatter: forward-scattered sunlight in shallow warm water
  float sss = pow(max(0.0, dot(uSunDirection, V)), 2.5)
            * (1.0 - depth) * sunElev * 0.38;
  waterColor += vec3(0.06, 0.25, 0.18) * sss;

  // ── Sun specular glitter ───────────────────────────────────────────────
  vec3  H       = normalize(uSunDirection + V);
  float specRaw = pow(max(dot(N, H), 0.0), 520.0);
  float specAmt = specRaw * 5.0 * sunElev;

  // Warm orange tint near horizon, pure white at zenith
  float warmT    = 1.0 - sunElev * sunElev;
  vec3  specTint = mix(vec3(1.00, 0.98, 0.93), vec3(1.00, 0.72, 0.28), warmT * 0.85);
  vec3  specColor = specTint * specAmt;

  // ── Foam ──────────────────────────────────────────────────────────────
  // Shore foam: narrow band centered on the actual coastline (world x ≈ 27).
  // Uses distance from shore so it doesn't spread across the whole water plane.
  float shoreDist = abs(vWorldPos.x - 27.0);
  float shoreProx = max(0.0, 1.0 - shoreDist / 2.2);
  float shoreFoam = shoreProx * shoreProx                        // sharpen falloff
                  * (0.35 + 0.65 * abs(sin(vWorldPos.x * 8.0 + uTime * 2.6)));
  shoreFoam = clamp(shoreFoam, 0.0, 0.48);

  // Whitecap foam: only the sharpest crest tips, only when seas are rough.
  // gSteepness = 0 means flat surface; approaches 1 at near-vertical crests.
  // Threshold 0.58 restricts foam to the top ~15% steepest points.
  // wavePower requires uWaveAmp > 0.85 before any whitecaps appear, so calm
  // and moderate conditions (sunny/cloudy PHT daytime) stay clean.
  float gSteepness = 1.0 - vGerstnerNormal.y;
  float wavePower  = smoothstep(0.85, 2.20, uWaveAmp);
  float whitecap   = smoothstep(0.58, 0.76, gSteepness) * wavePower * 0.42;

  float foam = clamp(shoreFoam + whitecap, 0.0, 0.62);

  // ── Composite ─────────────────────────────────────────────────────────
  vec3 col  = mix(waterColor, reflColor, fresnel * 0.75);
  col      += specColor;
  col       = mix(col, vec3(0.97, 0.98, 1.00), foam);  // foam: cool white

  // Alpha: more opaque at grazing angles (fresnel → opaque)
  float alpha = mix(0.82, 0.97, fresnel);

  gl_FragColor = vec4(col, alpha);
}
`;

// ── Public API ────────────────────────────────────────────────────────────────

export interface WaterMesh extends THREE.Mesh {
  material: THREE.ShaderMaterial;
}

export function createWater(scene: THREE.Scene, sunDirection: THREE.Vector3): WaterMesh {
  // Increased to 120×120 for better Gerstner wave definition
  const geo = new THREE.PlaneGeometry(220, 220, 120, 120);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.ShaderMaterial({
    vertexShader:   VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime:           { value: 0 },
      uWaveAmp:        { value: _amp },
      uSunDirection:   { value: sunDirection.clone() },
      uCameraPosition: { value: new THREE.Vector3() },
      uSkyHorizon:     { value: new THREE.Color(0xc2e8f8) },
      uSkyZenith:      { value: new THREE.Color(0x89b4d0) },
    },
    transparent: true,
    side:        THREE.FrontSide,
    depthWrite:  false,
  });

  const mesh = new THREE.Mesh(geo, mat) as WaterMesh;
  mesh.position.set(80, -0.18, 0);
  mesh.name = "water";
  scene.add(mesh);
  return mesh;
}

const _tmpDir = new THREE.Vector3();

export function updateWater(
  water:       WaterMesh,
  t:           number,
  cameraPos:   THREE.Vector3,
  sunPos:      THREE.Vector3,  // DirectionalLight.position (magnitude ≈ 120)
  skyHorizon:  THREE.Color,
  skyZenith:   THREE.Color,
  weatherMult: number,
): void {
  const u = water.material.uniforms;
  u.uTime.value = t;
  u.uCameraPosition.value.copy(cameraPos);
  _tmpDir.copy(sunPos).normalize();
  u.uSunDirection.value.copy(_tmpDir);
  u.uSkyHorizon.value.copy(skyHorizon);
  u.uSkyZenith.value.copy(skyZenith);
  u.uWaveAmp.value = smoothedWaveAmp(t, weatherMult);
}
