import * as THREE from "three";

export type WeatherPreset = "sunny" | "cloudy" | "overcast" | "rain" | "storm";

export interface WeatherConfig {
  label:       string;
  icon:        string;
  raining:     boolean;
  fogNear:     number;
  fogFar:      number;
  fogColor:    number;
  overrideFog: boolean;   // if false, dayCycle fog colour is kept
  cloudOpMult: number;    // multiply base sprite opacity
  cloudSpMult: number;    // multiply drift speed
  sunMult:     number;    // multiply sun intensity after dayCycle
  hemiMult:    number;    // multiply hemisphere intensity after dayCycle
  exposure:    number;    // toneMappingExposure
}

export const WEATHER: Record<WeatherPreset, WeatherConfig> = {
  sunny: {
    label: "Sunny",    icon: "☀",
    raining: false,
    fogNear: 100, fogFar: 260, fogColor: 0xc2e8f8, overrideFog: false,
    cloudOpMult: 1.0, cloudSpMult: 1.0,
    sunMult: 1.0,  hemiMult: 1.0,  exposure: 1.0,
  },
  cloudy: {
    label: "Cloudy",   icon: "⛅",
    raining: false,
    fogNear: 75, fogFar: 220, fogColor: 0xb0cce0, overrideFog: true,
    cloudOpMult: 1.8, cloudSpMult: 1.5,
    sunMult: 0.65, hemiMult: 0.80, exposure: 0.85,
  },
  overcast: {
    label: "Overcast", icon: "☁",
    raining: false,
    fogNear: 50, fogFar: 180, fogColor: 0x8aa4b8, overrideFog: true,
    cloudOpMult: 2.4, cloudSpMult: 2.0,
    sunMult: 0.35, hemiMult: 0.58, exposure: 0.68,
  },
  rain: {
    label: "Rain",     icon: "🌧",
    raining: true,
    fogNear: 28, fogFar: 140, fogColor: 0x6e8fa0, overrideFog: true,
    cloudOpMult: 2.8, cloudSpMult: 2.8,
    sunMult: 0.20, hemiMult: 0.42, exposure: 0.54,
  },
  storm: {
    label: "Storm",    icon: "⛈",
    raining: true,
    fogNear: 14, fogFar: 95,  fogColor: 0x4e6070, overrideFog: true,
    cloudOpMult: 3.2, cloudSpMult: 4.2,
    sunMult: 0.09, hemiMult: 0.28, exposure: 0.38,
  },
};

export const WEATHER_ORDER: WeatherPreset[] = ["sunny", "cloudy", "overcast", "rain", "storm"];

// Apply weather to fog and renderer each frame (call after updateDayCycle)
export function applyWeatherFrame(
  cfg:      WeatherConfig,
  scene:    THREE.Scene,
  sun:      THREE.DirectionalLight,
  hemi:     THREE.HemisphereLight,
  renderer: THREE.WebGLRenderer,
): void {
  sun.intensity  *= cfg.sunMult;
  hemi.intensity *= cfg.hemiMult;
  renderer.toneMappingExposure = cfg.exposure;

  if (cfg.overrideFog && scene.fog instanceof THREE.Fog) {
    scene.fog.near = cfg.fogNear;
    scene.fog.far  = cfg.fogFar;
    scene.fog.color.setHex(cfg.fogColor);
  } else if (!cfg.overrideFog && scene.fog instanceof THREE.Fog) {
    // Restore default range so dayCycle fog colour shows correctly
    scene.fog.near = 100;
    scene.fog.far  = 260;
  }
}
