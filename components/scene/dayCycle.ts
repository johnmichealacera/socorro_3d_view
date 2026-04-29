import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";

// Philippines Standard Time = UTC+8
// phase 0.0 = midnight, 0.25 = 6 AM, 0.5 = noon, 0.75 = 6 PM, 1.0 = midnight
function getPhilippinesPhase(): number {
  const now = new Date();
  const secondsOfDay =
    (now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds() + 8 * 3600) %
    86400;
  return secondsOfDay / 86400;
}

// Approximate sunrise/sunset for Surigao del Norte (≈ 9.8°N)
const SUNRISE = 6  / 24; // ~6:00 AM
const SUNSET  = 18 / 24; // ~6:00 PM

// Pre-allocated temporaries
const _sunDir  = new THREE.Vector3();
const _tmpCol  = new THREE.Color();
const _tmpCol2 = new THREE.Color();

// ── Keyframe tables (phase = hour / 24) ──────────────────────────────────────

interface LightKey {
  t:         number;
  color:     THREE.Color;
  intensity: number;
  hemiSky:   THREE.Color;
  hemiGnd:   THREE.Color;
}

const LIGHT_KEYS: LightKey[] = [
  { t: 0.00, color: new THREE.Color(0x0a1840), intensity: 0.15, hemiSky: new THREE.Color(0x08101e), hemiGnd: new THREE.Color(0x04060c) }, // 12 AM midnight
  { t: 0.17, color: new THREE.Color(0x1a2060), intensity: 0.20, hemiSky: new THREE.Color(0x101828), hemiGnd: new THREE.Color(0x060810) }, //  4 AM deep night
  { t: 0.23, color: new THREE.Color(0xff7030), intensity: 0.90, hemiSky: new THREE.Color(0xffb880), hemiGnd: new THREE.Color(0x3a2010) }, //  5:30 AM dawn
  { t: 0.29, color: new THREE.Color(0xffd0a0), intensity: 1.80, hemiSky: new THREE.Color(0xd8d0c0), hemiGnd: new THREE.Color(0x485040) }, //  7 AM morning
  { t: 0.50, color: new THREE.Color(0xfff4e0), intensity: 2.80, hemiSky: new THREE.Color(0xc2ddf5), hemiGnd: new THREE.Color(0x4a6e30) }, // 12 PM noon
  { t: 0.67, color: new THREE.Color(0xffb050), intensity: 2.20, hemiSky: new THREE.Color(0xf0c860), hemiGnd: new THREE.Color(0x503808) }, //  4 PM golden hour
  { t: 0.75, color: new THREE.Color(0xff5010), intensity: 1.10, hemiSky: new THREE.Color(0xc06030), hemiGnd: new THREE.Color(0x281005) }, //  6 PM sunset
  { t: 0.81, color: new THREE.Color(0x2040a0), intensity: 0.35, hemiSky: new THREE.Color(0x182848), hemiGnd: new THREE.Color(0x0c0618) }, //  7:26 PM twilight
  { t: 0.92, color: new THREE.Color(0x0a1840), intensity: 0.15, hemiSky: new THREE.Color(0x08101e), hemiGnd: new THREE.Color(0x04060c) }, // 10 PM night
  { t: 1.00, color: new THREE.Color(0x0a1840), intensity: 0.15, hemiSky: new THREE.Color(0x08101e), hemiGnd: new THREE.Color(0x04060c) }, // 12 AM midnight
];

interface SkyKey { t: number; turbidity: number; rayleigh: number; }
const SKY_KEYS: SkyKey[] = [
  { t: 0.00, turbidity: 6.0, rayleigh: 2.5 }, // midnight
  { t: 0.22, turbidity: 4.0, rayleigh: 2.0 }, // pre-dawn
  { t: 0.25, turbidity: 3.5, rayleigh: 1.5 }, // sunrise
  { t: 0.50, turbidity: 0.0, rayleigh: 0.2 }, // noon
  { t: 0.67, turbidity: 2.0, rayleigh: 1.0 }, // golden hour
  { t: 0.75, turbidity: 4.5, rayleigh: 2.0 }, // sunset
  { t: 0.83, turbidity: 6.0, rayleigh: 2.5 }, // night
  { t: 1.00, turbidity: 6.0, rayleigh: 2.5 }, // midnight
];

// ── Generic lerp sampler ──────────────────────────────────────────────────────

function sampleT<K extends { t: number }>(keys: K[], phase: number): [K, K, number] {
  for (let i = 0; i < keys.length - 1; i++) {
    if (phase >= keys[i].t && phase <= keys[i + 1].t) {
      const a = (phase - keys[i].t) / (keys[i + 1].t - keys[i].t);
      return [keys[i], keys[i + 1], a];
    }
  }
  return [keys[keys.length - 2], keys[keys.length - 1], 1];
}

// ── Public update ────────────────────────────────────────────────────────────

export function updateDayCycle(
  _elapsed:   number,
  sky:        Sky,
  sun:        THREE.DirectionalLight,
  hemisphere: THREE.HemisphereLight,
  _scene:     THREE.Scene
): void {
  const phase = getPhilippinesPhase();

  // Elevation: sine arc from sunrise to sunset; 0 outside those hours
  const dayFrac  = (phase - SUNRISE) / (SUNSET - SUNRISE);
  const elevNorm = Math.max(0, Math.sin(Math.max(0, Math.min(1, dayFrac)) * Math.PI));
  const elevation = 2 + elevNorm * 68;

  // Azimuth: east (90°) at 6 AM → south (180°) at noon → west (270°) at 6 PM
  const sunProgress = Math.max(0, Math.min(1, dayFrac));
  const azimuth = THREE.MathUtils.degToRad(90 + sunProgress * 180);

  const phi = THREE.MathUtils.degToRad(90 - elevation);
  _sunDir.setFromSphericalCoords(1, phi, azimuth);
  sky.material.uniforms["sunPosition"].value.copy(_sunDir);

  // Sky atmosphere
  const [sa, sb, salpha] = sampleT(SKY_KEYS, phase);
  sky.material.uniforms["turbidity"].value = sa.turbidity + (sb.turbidity - sa.turbidity) * salpha;
  sky.material.uniforms["rayleigh"].value  = sa.rayleigh  + (sb.rayleigh  - sa.rayleigh)  * salpha;

  // Physical sun light
  sun.position.copy(_sunDir).multiplyScalar(120);
  sun.visible    = elevNorm > 0.04;
  sun.castShadow = elevNorm > 0.08;

  // Light color / intensity
  const [la, lb, lalpha] = sampleT(LIGHT_KEYS, phase);
  sun.color.copy(la.color).lerp(lb.color, lalpha);
  sun.intensity = la.intensity + (lb.intensity - la.intensity) * lalpha;

  hemisphere.color.copy(_tmpCol.copy(la.hemiSky).lerp(lb.hemiSky, lalpha));
  hemisphere.groundColor.copy(_tmpCol2.copy(la.hemiGnd).lerp(lb.hemiGnd, lalpha));
  hemisphere.intensity = 0.55 + elevNorm * 0.45;
}
