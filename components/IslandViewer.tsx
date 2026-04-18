"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";

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
import { createPostProcessing, resizeComposer } from "./scene/postprocessing";
import {
  animateBuildings,
  buildingCameraTarget,
  animateCameraTo,
  type CameraTarget,
} from "./scene/animation";

import { LOCATIONS } from "./scene/locations";
import { LocationData, BuildingGroup } from "./scene/types";
import InfoPanel from "./InfoPanel";
import HUD from "./HUD";

export default function IslandViewer() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const sceneRef    = useRef<THREE.Scene | null>(null);
  const cameraRef   = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const buildingsRef= useRef<BuildingGroup[]>([]);
  const waterRef    = useRef<WaterMesh | null>(null);
  const rafRef      = useRef<number>(0);

  const hoveredIdRef  = useRef<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);   // mirror of state for anim loop
  const camTargetRef  = useRef<CameraTarget | null>(null);
  const raycaster     = useRef(new THREE.Raycaster());
  const mouse         = useRef(new THREE.Vector2(-9999, -9999));

  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [selectedId, setSelectedId]             = useState<string | null>(null);

  // Keep ref in sync
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

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
    const { sunDirection } = createSky(scene, renderer);

    // Lights — match sky sun
    const { sun } = createLights(scene);
    sun.position
      .copy(sunDirection)
      .multiplyScalar(120);

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

    // Vegetation
    createVegetation(scene);

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

    // Post-processing
    const composer = createPostProcessing(renderer, scene, camera);
    composerRef.current = composer;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping    = true;
    controls.dampingFactor    = 0.06;
    controls.minDistance      = 4;
    controls.maxDistance      = 180;
    controls.maxPolarAngle    = Math.PI / 2.1;
    controls.target.set(3, 0, 5);
    controls.update();
    controlsRef.current = controls;

    // ── Resize ──────────────────────────────────────────────────────────
    const onResize = () => {
      const W = window.innerWidth, H = window.innerHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
      composer.setSize(W, H);
      resizeLabelRenderer(labelRenderer);
      resizeComposer(composer, W, H);
    };
    window.addEventListener("resize", onResize);

    // ── Mouse tracking ───────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth)  *  2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * -2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── Click (select building) ───────────────────────────────────────────
    const onClick = () => {
      raycaster.current.setFromCamera(mouse.current, camera);

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

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      clock.update();
      const t = clock.getElapsed();

      // Water
      if (waterRef.current) {
        updateWater(waterRef.current, t, camera.position);
      }

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

      // Camera fly-to
      if (camTargetRef.current) {
        animateCameraTo(camera, controls, camTargetRef.current);
      }

      controls.update();

      // Labels (CSS2D) always face camera
      labelRenderer.render(scene, camera);

      // Main render via post-processing composer
      composer.render();
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
      controls.dispose();
      composer.dispose();
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

      <HUD selectedId={selectedId} onLocationSelect={selectLocation} />

      <InfoPanel location={selectedLocation} onClose={clearSelection} />

      <style>{`
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}
