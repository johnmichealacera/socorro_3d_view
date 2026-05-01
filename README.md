# Socorro 3D Interactive Map

An interactive 3D aerial map of **Socorro, Surigao del Norte, Philippines** — a real island municipality on Bucas Grande in the Philippine Sea. Built with Three.js and Next.js, it renders the town's coastal geography, landmark buildings, road network, port vessels, NPCs, weather, time of day, folklore discoveries, and live community events in real-time WebGL.

---

## Overview

What started as a technical demo has become a **living digital twin** — a place that feels inhabited, emotionally authentic to Socorro Island, and rewards exploration. Locals recognise it. Tourists want to visit. Students linger. LGU stakeholders feel pride.

> *"I feel like I'm actually there, looking down at home."*

---

## Features

### Landmark Buildings (14 total)
Detailed procedural 3D models in Filipino coastal-town vernacular architecture, each clickable with a rich info panel:

| Landmark | Category | Description |
|---|---|---|
| Municipal Hall | Government | 2-story colonial concrete building with porch columns and flag pole |
| St. Joseph Parish Church | Church | Spanish-Filipino stone nave with bell tower, spire, and gold cross |
| Poblacion Plaza | Plaza | Open civic square with fountain, benches, and paved paths |
| Public Market | Market | Open-air *palengke* with corrugated steel roof and market stalls |
| SOEMCO Office | Commercial | Surigao del Norte Electric Cooperative district office |
| National High School | School | Multi-block campus with covered courts and flag circle |
| Elementary School | School | DepEd block with open verandah and school garden |
| General Hospital | Hospital | Two-wing clinic with helipad marker and ambulance bay |
| Socorro Port | Port | Deep-water pier with warehouse, loading crane, and mooring bollards |
| Palawan Pawnshop | Commercial | Shopfront with signage and glass display |
| Sofeco Hardware | Commercial | Hardware store with tin-roof canopy |
| Sofeco General Store | Commercial | General merchandise store across from the pawnshop |
| Taruc Swimming Pool | Recreation | 50-metre pool complex with concrete deck, diving board, and lounge chairs |
| Puyangi White Beach | Beach | Sandy beach resort with nipa-roof reception, cabanas, and shore pathway |

Each landmark info panel includes **historical heritage data** — year established, founding history, and a local fun fact sourced from community records.

---

### Living Atmosphere (Phase 1)

| System | Description |
|---|---|
| **Bloom post-processing** | Selective UnrealBloomPass on layer 1 (two-composer pattern) — sun glitter on water glows warm, church cross shimmers, street lamps radiate |
| **Atmospheric fog** | FogExp2 (density 0.0028) tinted to sky horizon — distant hills and the far ocean edge fade into tropical haze, adding scale and depth |
| **Animated cloud sprites** | 8 canvas-rendered billboard clouds drift slowly westward at altitude 18–30, wrapping east-to-west, with gentle vertical bob |
| **Seabirds over the bay** | 12 bird sprites in three flight modes: circling over bay, gliding along shore, perched on pier — wing-beat simulated via scaleX oscillation |
| **Tricycle vehicles** | 4 Philippine-style tricycles (yellow, blue, red, green) follow OSM road paths with arc-length parameterisation, wheel rotation, and direction-facing |
| **Ambient soundscape** | Web Audio API layered ambience: ocean surf, wind, church bells, seabird calls, and market chatter — position-aware, fades by distance |
| **Day/night cycle** | Full 10-minute real-time day cycle: golden-hour sun, dusk-to-night light colour interpolation, star field at night, building window glow, firefly particles at dusk |
| **Cinematic intro** | 6-second aerial orbit on first load — high view descends and circles the island before handing orbit control to the user |

---

### Stories & Discovery (Phase 2)

| System | Description |
|---|---|
| **Discovery orbs** | 10 glowing collectibles hidden across the map — 6 historical artefacts (fishing net, school bell, market lantern, founding stone, tuba jar, old anchor) + 4 folklore stories |
| **Folklore layer** | Phase 4 additions: Legend of the White Sand, The Sohoton Keeper, The Fisherman's Star, The Bell That Rang Alone — oral traditions rendered as glowing story orbs near their real locations |
| **Depth of field** | BokehPass in the final composer pipeline — distant objects soften as focus tracks the current camera distance, giving a documentary-photography feel when zoomed in |
| **NPC schedules** | Pedestrian density scales by real clock hour — morning market rush, midday school crowd, evening town plaza |
| **Firefly particles** | Instanced yellow sprites appear near vegetation at dusk, slowly drifting with sine-based XYZ offsets |

---

### Digital Heritage (Phase 3)

| System | Description |
|---|---|
| **Heritage data** | 10 landmark entries with `established` year, `history` paragraph, and `funFact` — rendered in the info panel when a building is selected |
| **LGU event pins** | Upcoming community events appear as floating labelled pins above their venue building — pulsing ring, CSS2D name label, auto-hidden for past events |
| **Events panel** | Slide-in panel listing annual Socorro events sorted by proximity to today; imminent events (≤3 days) highlighted; click an event to fly to its venue |
| **Stats panel** | Municipality overview: population, area, barangays, coastline length, distance to Surigao City |
| **Time simulator** | HUD control to override the day cycle to any hour (0–23), useful for experiencing golden hour, dusk, or night on demand |
| **Celestial features** | Moon disc, animated star field, and street-lamp / window-light system tied to the day/night cycle |

---

### Connected Community (Phase 4)

| System | Description |
|---|---|
| **Live weather** | Server-side Next.js API route proxies OpenWeatherMap for Socorro's coordinates — syncs weather preset, temperature, and description every 10 minutes; graceful fallback when no key is set |
| **Ghost visitors** | 5 named simulated visitors (Ate Grace, Kuya Rodel, Lola Coring, Bunso Kiko, Manong Ben) wander between landmarks as coloured sprite dots with CSS2D name labels |
| **URL deep linking** | Share button copies a URL encoding current camera position, orbit target, and selected landmark — restores full view state on load via `#c=x,y,z&t=x,z&s=id` hash |
| **Visitor counter** | HUD header shows count of currently active ghost visitors with a live teal dot |
| **Weather card** | Live temperature °C, weather description, and LIVE badge when OpenWeatherMap data is active |

---

### Interactive UI

- **Compact landmark dropdown** — top-left trigger button with search/filter, grouped by category, click to fly to any location
- **Info panel** — slides in with name, category, description, and heritage data (history + fun fact)
- **Events panel** — right-side panel with upcoming events, category tags, and days-until countdown
- **Stats panel** — municipality facts panel accessible from HUD
- **Share button** — one-click URL copy with "✓ Copied!" confirmation
- **Sound toggle** — mute/unmute ambient soundscape
- **CSS2D labels** — float above every building, always face camera
- **OrbitControls** — damped orbit, pan, zoom (min 4 → max 280 units)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router, Turbopack) |
| 3D Engine | Three.js r184 |
| Post-processing | Three.js EffectComposer — UnrealBloomPass, BokehPass, ShaderPass (MixShader, OutputPass) |
| Language | TypeScript |
| Styling | Tailwind CSS + inline React styles |
| Audio | Web Audio API (no library) |
| Weather | OpenWeatherMap API (server-proxied via Next.js route) |
| Renderer | WebGL 2 via Three.js WebGLRenderer |

---

## Coordinate System

```
          North (–Z)
              |
  West (–X) ──┼── East (+X)  ← Bay / ocean
              |
          South (+Z)
```

- **Origin** — Municipal Hall area
- **Scale** — 1 scene unit ≈ 10 metres
- **Terrain** — x ∈ [−80, 80], z ∈ [−80, 80]
- **Bay / water** — east of x ≈ 26 (shore at the port)
- **Hills** — west (negative X) and inland

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Live Weather (Optional)

Create `.env.local` and add your OpenWeatherMap API key:

```
OPENWEATHER_API_KEY=your_key_here
```

Without a key the app runs normally — weather defaults to manual presets. With a key, weather syncs automatically to real Socorro conditions every 10 minutes.

---

### Controls

| Action | Input |
|---|---|
| Orbit | Left-drag |
| Pan | Right-drag |
| Zoom | Scroll wheel |
| Select landmark | Left-click building |
| Deselect | Left-click empty area |
| Jump to landmark | Landmark dropdown (top-left) |
| Open events | Events button (HUD) |
| Open stats | Stats button (HUD) |
| Simulate time | Time slider (HUD) |
| Change weather | Weather buttons (HUD) |
| Share view | Share button (HUD) |
| Toggle sound | Speaker button (HUD) |

---

## File Structure

```
app/
  api/
    weather/
      route.ts          Server-side weather proxy (OpenWeatherMap, keeps API key private)
  layout.tsx            Next.js root layout + metadata + SVG favicon
  page.tsx              Root page (renders IslandViewer + SoundSystem)
  globals.css           Global Tailwind base styles

components/
  scene/
    sceneSetup.ts       Scene, camera, WebGLRenderer, directional + hemisphere lights
    terrain.ts          Procedural height map mesh + baked 2048px texture
    water.ts            Custom GLSL Gerstner ocean shader (waves, Fresnel, sun specular)
    sky.ts              Three.js Sky shader with day/night uniform interpolation
    roads.ts            Road ribbon geometry with terrain draping + centre-line dashes
    markers.ts          All 14 landmark 3D building models
    boats.ts            Port vessels — bangkas, motorboats, sailing yacht
    npcs.ts             Animated pedestrian sprites with time-aware idle/walk FSM
    vegetation.ts       Trees, palms, and foliage instances
    labels.ts           CSS2D floating building labels
    clouds.ts           Canvas billboard cloud sprites with westward drift
    birds.ts            Seabird sprites with circling, gliding, and perching modes
    vehicles.ts         Philippine tricycle path-following vehicles
    lights.ts           Street lamps, landmark lights, celestial body (moon + stars)
    fireflies.ts        Dusk firefly instanced point particles
    eventPins.ts        CSS2D event pins above venue buildings (upcoming events only)
    visitors.ts         Ghost visitor sprites + name labels wandering landmarks
    discovery.ts        Folklore/artefact discovery orbs with click-reveal stories
    heritage.ts         Static heritage data — established year, history, fun facts
    eventData.ts        Annual event definitions (pure data, no THREE dependency)
    animation.ts        Camera fly-to, intro cinematic, building hover/select
    locations.ts        Landmark data (id, name, description, position, category)
    postprocessing.ts   Two-composer bloom pipeline + BokehPass DOF
    types.ts            Shared TypeScript interfaces
  IslandViewer.tsx      Main scene orchestrator and React component
  SoundSystem.tsx       Web Audio ambient soundscape (ocean, wind, bells, birds)
  InfoPanel.tsx         Selected-building info panel with heritage data
  HUD.tsx               Full HUD — weather, clock, landmark dropdown, sound toggle, share
  EventsPanel.tsx       Upcoming community events panel
  StatsPanel.tsx        Municipality statistics panel

public/
  favicon.svg           App icon — island + location pin on ocean background
```

---

## Building for Production

```bash
npm run build
npm start
```

Or deploy instantly to [Vercel](https://vercel.com) — add `OPENWEATHER_API_KEY` as an environment variable in the Vercel project settings to enable live weather sync.
