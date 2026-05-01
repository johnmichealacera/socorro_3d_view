"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { createScene, createCamera, createRenderer, createLights } from "./scene/sceneSetup";
import { createSky } from "./scene/sky";
import { createTerrain } from "./scene/terrain";
import { createWater, updateWater, type WaterMesh } from "./scene/water";
import { createBuildings } from "./scene/markers";
import { createVegetation } from "./scene/vegetation";
import { createRoads } from "./scene/roads";
import {
  createLabelRenderer,
  disposeLabelRenderer,
  resizeLabelRenderer,
  attachLabel,
} from "./scene/labels";
import { createPostProcessing, resizeComposer, updateDOF, BLOOM_LAYER, type PostProcessing } from "./scene/postprocessing";
import {
  animateBuildings,
  buildingCameraTarget,
  animateCameraTo,
  type CameraTarget,
} from "./scene/animation";
import { createNPCs, updateNPCs, disposeNPCs, type NPCData } from "./scene/npcs";
import { createBoats, updateBoats, disposeBoats, type BoatData } from "./scene/boats";
import { createBirds, updateBirds, disposeBirds, type BirdData } from "./scene/birds";
import { createVehicles, updateVehicles, disposeVehicles, type VehicleData } from "./scene/vehicles";
import { createClouds, updateClouds, disposeClouds, type CloudSprite } from "./scene/clouds";
import { createFireflies, updateFireflies, disposeFireflies, type FireflyData } from "./scene/fireflies";
import { createDiscoveries, updateDiscoveries, disposeDiscoveries, type DiscoveryObject } from "./scene/discovery";
import { createRain, updateRain, setRaining, disposeRain, type RainSystem } from "./scene/rain";
import { updateDayCycle } from "./scene/dayCycle";
import { runIntroCamera } from "./scene/animation";
import { Sky } from "three/addons/objects/Sky.js";
import { WEATHER, applyWeatherFrame, type WeatherPreset } from "./scene/weather";
import { createStreetLamps, updateStreetLamps, disposeStreetLamps, type LampSystem } from "./scene/streetLamps";
import { createLandmarkLights, updateLandmarkLights, disposeLandmarkLights, type LandmarkLightSystem } from "./scene/landmarkLights";
import { createCelestials, updateCelestials, disposeCelestials, type CelestialsSystem } from "./scene/celestials";
import { createEventPins, updateEventPins, disposeEventPins, type EventPinObject } from "./scene/eventPins";
import { createVisitors, updateVisitors, disposeVisitors, type VisitorData } from "./scene/visitors";
import { setSimulatedHour } from "./scene/timeOverride";

import { LOCATIONS } from "./scene/locations";
import { LocationData, BuildingGroup } from "./scene/types";
import { type DiscoveryDef } from "./scene/discovery";
import InfoPanel from "./InfoPanel";
import DiscoveryPopup from "./DiscoveryPopup";
import HUD from "./HUD";

export default function IslandViewer() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const sceneRef    = useRef<THREE.Scene | null>(null);
  const cameraRef   = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const ppRef = useRef<PostProcessing | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const buildingsRef= useRef<BuildingGroup[]>([]);
  const waterRef    = useRef<WaterMesh | null>(null);
  const npcsRef     = useRef<NPCData[]>([]);
  const boatsRef    = useRef<BoatData[]>([]);
  const birdsRef    = useRef<BirdData[]>([]);
  const vehiclesRef = useRef<VehicleData[]>([]);
  const cloudsRef     = useRef<CloudSprite[]>([]);
  const firefliesRef  = useRef<FireflyData[]>([]);
  const discoveryRef  = useRef<DiscoveryObject[]>([]);
  const rainRef       = useRef<RainSystem | null>(null);
  const lampsRef         = useRef<LampSystem | null>(null);
  const landmarkLightsRef = useRef<LandmarkLightSystem | null>(null);
  const celestialsRef     = useRef<CelestialsSystem | null>(null);
  const eventPinsRef      = useRef<EventPinObject[]>([]);
  const visitorsRef       = useRef<VisitorData[]>([]);
  const weatherRef    = useRef<WeatherPreset>("sunny");
  const skyRef      = useRef<Sky | null>(null);
  const sunRef      = useRef<THREE.DirectionalLight | null>(null);
  const hemiRef     = useRef<THREE.HemisphereLight | null>(null);
  const introRef    = useRef(false); // true once intro completes
  const rafRef      = useRef<number>(0);

  const hoveredIdRef  = useRef<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);   // mirror of state for anim loop
  const camTargetRef  = useRef<CameraTarget | null>(null);
  const raycaster     = useRef(new THREE.Raycaster());
  const mouse         = useRef(new THREE.Vector2(-9999, -9999));

  const [selectedLocation,  setSelectedLocation]  = useState<LocationData | null>(null);
  const [selectedId,        setSelectedId]         = useState<string | null>(null);
  const [selectedDiscovery, setSelectedDiscovery]  = useState<DiscoveryDef | null>(null);
  const [weather,           setWeather]            = useState<WeatherPreset>("sunny");
  const [simHour,           setSimHour]            = useState<number | null>(null);
  // Phase 4
  const [isLiveWeather,    setIsLiveWeather]    = useState(false);
  const [liveWeatherInfo,  setLiveWeatherInfo]  = useState<{ tempC: number; description: string } | null>(null);

  // Keep ref in sync
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  // Sync simulated hour to the timeOverride module so all scene systems pick it up
  useEffect(() => { setSimulatedHour(simHour); }, [simHour]);

  const changeSimHour = useCallback((h: number | null) => { setSimHour(h); }, []);

  // ── Phase 4: Live weather polling ────────────────────────────────────────────
  useEffect(() => {
    async function fetchWeather() {
      try {
        const res  = await fetch("/api/weather");
        const data = await res.json();
        if (data.isLive) {
          setIsLiveWeather(true);
          setLiveWeatherInfo({ tempC: data.tempC, description: data.description });
          weatherRef.current = data.preset;
          setWeather(data.preset);
          const cfg = WEATHER[data.preset as WeatherPreset];
          if (rainRef.current) setRaining(rainRef.current, cfg.raining);
        } else {
          setIsLiveWeather(false);
        }
      } catch { /* no-op — live weather is optional */ }
    }
    fetchWeather();
    const id = setInterval(fetchWeather, 10 * 60 * 1000); // every 10 minutes
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Phase 4: Share / deep-link ───────────────────────────────────────────────
  // Restore camera from URL hash on first render (runs once after scene init).
  const urlRestoredRef = useRef(false);
  useEffect(() => {
    if (urlRestoredRef.current) return;
    urlRestoredRef.current = true;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const p = new URLSearchParams(hash);
    const cam = p.get("c")?.split(",").map(Number);
    const tgt = p.get("t")?.split(",").map(Number);
    const loc = p.get("s");
    if (cam?.length === 3 && cameraRef.current) {
      cameraRef.current.position.set(cam[0], cam[1], cam[2]);
    }
    if (tgt?.length === 2 && controlsRef.current) {
      controlsRef.current.target.set(tgt[0], 0, tgt[1]);
      controlsRef.current.update();
    }
    if (loc) selectLocation(loc);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getShareURL = useCallback((): string => {
    const cam = cameraRef.current;
    const ctl = controlsRef.current;
    if (!cam || !ctl) return window.location.href;
    const c = `${cam.position.x.toFixed(1)},${cam.position.y.toFixed(1)},${cam.position.z.toFixed(1)}`;
    const t = `${ctl.target.x.toFixed(1)},${ctl.target.z.toFixed(1)}`;
    const s = selectedId ? `&s=${selectedId}` : "";
    return `${window.location.origin}${window.location.pathname}#c=${c}&t=${t}${s}`;
  }, [selectedId]);

  // ── Selection helpers ────────────────────────────────────────────────────────

  const selectLocation = useCallback((id: string) => {
    const loc = LOCATIONS.find((l) => l.id === id);
    if (!loc) return;
    setSelectedLocation(loc);
    setSelectedId(id);

    // Find the building group for this location to get its actual Y
    const bgrp = buildingsRef.current.find((b) => b.userData.location.id === id);
    const by   = bgrp ? bgrp.userData.baseY : 0;

    camTargetRef.current = buildingCameraTarget(
      loc.position[0], by, loc.position[2], loc.category
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedLocation(null);
    setSelectedId(null);
    camTargetRef.current = null;
  }, []);

  const changeWeather = useCallback((w: WeatherPreset) => {
    weatherRef.current = w;
    setWeather(w);
    const cfg = WEATHER[w];
    if (rainRef.current) setRaining(rainRef.current, cfg.raining);
    window.dispatchEvent(new CustomEvent("socorro:weather", {
      detail: { raining: cfg.raining },
    }));
  }, []);

  // ── Scene bootstrap ───────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Core
    const scene    = createScene();
    const camera   = createCamera(window.innerWidth, window.innerHeight);
    const renderer = createRenderer(canvas);
    sceneRef.current    = scene;
    cameraRef.current   = camera;
    rendererRef.current = renderer;

    // Sky — sets scene.background and returns sun direction
    const { sky, sunDirection } = createSky(scene, renderer);
    skyRef.current = sky;

    // Lights — match sky sun; store refs for day cycle
    const { sun, hemisphere } = createLights(scene);
    sunRef.current  = sun;
    hemiRef.current = hemisphere;
    sun.position.copy(sunDirection).multiplyScalar(120);

    // Terrain
    const terrain = createTerrain(scene);

    // Water — east of terrain, custom GLSL
    const water = createWater(scene, sunDirection);
    waterRef.current = water;

    // Roads — laid before buildings so buildings sit on top
    createRoads(scene);

    // Buildings
    const buildings = createBuildings(scene, terrain, LOCATIONS);
    buildingsRef.current = buildings;

    // NPCs — spawned after buildings so terrain height is available
    npcsRef.current = createNPCs(scene, buildings);

    // Boats — placed in the bay east of the port
    boatsRef.current = createBoats(scene);

    // Vegetation
    createVegetation(scene);

    // Ambient life systems
    birdsRef.current    = createBirds(scene);
    vehiclesRef.current = createVehicles(scene);
    cloudsRef.current   = createClouds(scene);

    // Phase 2 systems
    firefliesRef.current = createFireflies(scene);
    discoveryRef.current = createDiscoveries(scene);
    rainRef.current      = createRain(scene);
    lampsRef.current          = createStreetLamps(scene);
    landmarkLightsRef.current = createLandmarkLights(scene, buildings);
    celestialsRef.current     = createCelestials(scene);
    eventPinsRef.current      = createEventPins(scene, buildings);
    visitorsRef.current       = createVisitors(scene);

    // CSS2D labels — attached to building groups
    const labelRenderer = createLabelRenderer();
    for (const b of buildings) {
      const cat = b.userData.location.category;
      const h = b.getObjectByName("church") ? 3.8
              : cat === "port"       ? 1.8
              : cat === "plaza"      ? 3.2
              : cat === "commercial" ? 1.6
              : 2.2;
      attachLabel(b, b.userData.location, h);
    }

    // Post-processing — selective bloom (sky background excluded via caller-side layer trick)
    const pp = createPostProcessing(renderer, scene, camera);
    ppRef.current = pp;

    // Assign BLOOM_LAYER to emissive objects so only they receive bloom.
    // The sky, terrain, buildings, roads, vehicles, NPCs stay on layer 0 only.
    if (celestialsRef.current) {
      celestialsRef.current.sunSprite.layers.enable(BLOOM_LAYER);
      celestialsRef.current.moonSprite.layers.enable(BLOOM_LAYER);
      celestialsRef.current.stars.layers.enable(BLOOM_LAYER);
    }
    for (const f of firefliesRef.current) {
      f.sprite.layers.enable(BLOOM_LAYER);
    }
    if (landmarkLightsRef.current) {
      for (const entry of landmarkLightsRef.current.entries) {
        for (const halo of entry.halos) halo.layers.enable(BLOOM_LAYER);
      }
    }
    if (lampsRef.current) {
      for (const glow of lampsRef.current.glows) glow.layers.enable(BLOOM_LAYER);
    }

    // OrbitControls — map-style: left-drag pans, right-drag orbits
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping    = true;
    controls.dampingFactor    = 0.06;
    controls.minDistance      = 4;
    controls.maxDistance      = 280;
    controls.maxPolarAngle    = Math.PI / 2.1;
    controls.screenSpacePanning = false;          // pan along world horizontal plane
    controls.panSpeed         = 1.4;              // slightly faster panning
    controls.mouseButtons     = {
      LEFT:   THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT:  THREE.MOUSE.ROTATE,
    };
    controls.touches          = {
      ONE: THREE.TOUCH.PAN,           // one-finger drag = pan (map-like)
      TWO: THREE.TOUCH.DOLLY_ROTATE,  // pinch/rotate = zoom + orbit
    };
    controls.target.set(3, 0, 5);
    controls.update();
    controlsRef.current = controls;

    // ── Resize ──────────────────────────────────────────────────────────
    const onResize = () => {
      const W = window.innerWidth, H = window.innerHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
      resizeLabelRenderer(labelRenderer);
      if (ppRef.current) resizeComposer(ppRef.current, W, H);
    };
    window.addEventListener("resize", onResize);

    // ── Mouse tracking ───────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth)  *  2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * -2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── Click (select building or discovery) ─────────────────────────────
    const onClick = () => {
      raycaster.current.setFromCamera(mouse.current, camera);

      // Discovery objects take priority
      const discMeshes = discoveryRef.current.map(o => o.orb);
      const dHits = raycaster.current.intersectObjects(discMeshes, false);
      if (dHits.length > 0) {
        const id  = dHits[0].object.userData.discoveryId as string;
        const obj = discoveryRef.current.find(o => o.def.id === id);
        if (obj) { setSelectedDiscovery(obj.def); return; }
      }

      // Collect all meshes inside building groups
      const buildingMeshes: THREE.Object3D[] = [];
      for (const b of buildingsRef.current) {
        b.traverse((c) => { if (c instanceof THREE.Mesh) buildingMeshes.push(c); });
      }

      const hits = raycaster.current.intersectObjects(buildingMeshes, false);
      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && !(obj as BuildingGroup).userData?.isBuilding) obj = obj.parent;
        if (obj?.userData?.isBuilding) {
          const loc = (obj as BuildingGroup).userData.location;
          if (selectedIdRef.current === loc.id) clearSelection();
          else selectLocation(loc.id);
          return;
        }
      }
      clearSelection();
    };
    canvas.addEventListener("click", onClick);

    // ── Animation loop ────────────────────────────────────────────────────
    const clock = new THREE.Timer();
    let prevT = 0;

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      clock.update();
      const t     = clock.getElapsed();
      const delta = Math.min(t - prevT, 0.05); // cap at 50 ms to avoid large jumps
      prevT = t;

      // Weather config available to all systems this frame
      const wCfg = WEATHER[weatherRef.current];

      // Day/night cycle — sky, lights (sets base intensities / fog colour)
      if (skyRef.current && sunRef.current && hemiRef.current) {
        updateDayCycle(t, skyRef.current, sunRef.current, hemiRef.current, scene);
        applyWeatherFrame(wCfg, scene, sunRef.current, hemiRef.current, renderer);
      }

      // Water — pass current sky colours so reflections match time of day and weather
      if (waterRef.current && sunRef.current && hemiRef.current) {
        const fogColor = (scene.fog instanceof THREE.Fog) ? scene.fog.color : new THREE.Color(0xc2e8f8);
        updateWater(
          waterRef.current, t, camera.position,
          sunRef.current.position,
          fogColor,
          hemiRef.current.color,
          wCfg.waveMult,
        );
      }

      // NPCs
      updateNPCs(npcsRef.current, t, delta);

      // Boats
      updateBoats(boatsRef.current, t);

      // Birds, vehicles, clouds
      updateBirds(birdsRef.current, t, delta);
      updateVehicles(vehiclesRef.current, delta);
      updateClouds(cloudsRef.current, t, delta, wCfg.cloudOpMult, wCfg.cloudSpMult);

      // Phase 2
      updateFireflies(firefliesRef.current, t, delta);
      updateDiscoveries(discoveryRef.current, t, null);
      if (rainRef.current) updateRain(rainRef.current, delta, camera.position);
      if (lampsRef.current) updateStreetLamps(lampsRef.current, t, delta);
      if (landmarkLightsRef.current) updateLandmarkLights(landmarkLightsRef.current, t, delta, wCfg.sunMult);
      if (celestialsRef.current) updateCelestials(celestialsRef.current, t);
      updateEventPins(eventPinsRef.current, t);
      updateVisitors(visitorsRef.current, t, delta);

      // Hover detection
      raycaster.current.setFromCamera(mouse.current, camera);
      const bMeshes: THREE.Object3D[] = [];
      for (const b of buildingsRef.current) {
        b.traverse((c) => { if (c instanceof THREE.Mesh) bMeshes.push(c); });
      }
      const hHits = raycaster.current.intersectObjects(bMeshes, false);
      if (hHits.length > 0) {
        let obj: THREE.Object3D | null = hHits[0].object;
        while (obj && !(obj as BuildingGroup).userData?.isBuilding) obj = obj.parent;
        hoveredIdRef.current = (obj as BuildingGroup)?.userData?.location?.id ?? null;
        canvas.style.cursor = "pointer";
      } else {
        hoveredIdRef.current = null;
        canvas.style.cursor = "default";
      }

      // Building animations
      animateBuildings(buildingsRef.current, t, hoveredIdRef.current, selectedIdRef.current);

      // Cinematic intro — block user input and drive camera manually
      if (!introRef.current) {
        controls.enabled = false;
        const done = runIntroCamera(camera, controls, t);
        if (done) { introRef.current = true; controls.enabled = true; }
      } else {
        // Camera fly-to (only active after intro)
        if (camTargetRef.current) {
          animateCameraTo(camera, controls, camTargetRef.current);
        }
        controls.update();
      }

      // Labels (CSS2D) always face camera
      labelRenderer.render(scene, camera);

      // DOF focus tracks the orbit target distance each frame
      if (ppRef.current && controlsRef.current) {
        updateDOF(ppRef.current, camera.position.distanceTo(controlsRef.current.target));
      }

      if (ppRef.current) {
        const { bloomComposer, finalComposer } = ppRef.current;

        // Bloom pass — camera sees only BLOOM_LAYER objects; sky background
        // is temporarily removed so the sky never contributes to bloom.
        const savedBg = scene.background;
        scene.background = null;
        camera.layers.set(BLOOM_LAYER);
        bloomComposer.render();
        camera.layers.enableAll();
        scene.background = savedBg;

        // Final pass — renders full scene and additively overlays bloom.
        finalComposer.render();
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
      disposeNPCs(npcsRef.current);
      disposeBoats(boatsRef.current);
      disposeBirds(birdsRef.current);
      disposeVehicles(vehiclesRef.current);
      disposeClouds(cloudsRef.current);
      disposeFireflies(firefliesRef.current);
      disposeDiscoveries(discoveryRef.current);
      if (rainRef.current) disposeRain(rainRef.current);
      if (lampsRef.current) disposeStreetLamps(lampsRef.current);
      if (landmarkLightsRef.current) disposeLandmarkLights(landmarkLightsRef.current);
      if (celestialsRef.current) disposeCelestials(celestialsRef.current);
      disposeEventPins(eventPinsRef.current);
      disposeVisitors(visitorsRef.current);
      controls.dispose();
      ppRef.current?.bloomComposer.dispose();
      ppRef.current?.finalComposer.dispose();
      renderer.dispose();
      disposeLabelRenderer(labelRenderer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />

      <HUD
        selectedId={selectedId}
        onLocationSelect={selectLocation}
        weather={weather}
        onWeatherChange={changeWeather}
        simHour={simHour}
        onSimHourChange={changeSimHour}
        visitorCount={visitorsRef.current.length}
        isLiveWeather={isLiveWeather}
        liveWeatherInfo={liveWeatherInfo}
        onGetShareURL={getShareURL}
      />

      <InfoPanel location={selectedLocation} onClose={clearSelection} />

      <DiscoveryPopup
        discovery={selectedDiscovery}
        onClose={() => setSelectedDiscovery(null)}
      />

      <style>{`
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}
