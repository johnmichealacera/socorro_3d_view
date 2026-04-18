# Socorro 3D Interactive Map

An interactive 3D aerial map of **Socorro, Surigao del Norte, Philippines** — a real island municipality on Bucas Grande in the Philippine Sea. Built with Three.js and Next.js, it renders the town's coastal geography, landmark buildings, road network, port vessels, NPCs, and ocean in real-time WebGL.

---

## Features

### Landmark Buildings (14 total)
Detailed 3D models in Filipino coastal-town vernacular architecture, each clickable with an info panel:

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

### Port Vessels
Seven boats animate with gentle wave-bobbing in the bay east of the port pier:
- **4 Filipino bangkas** — traditional narrow outrigger fishing boats with bamboo ama, deck planks, mast, and triangular sail
- **2 open motorboats** — fibreglass day-cruisers with windscreen, console, and navigation lights
- **1 sailing yacht** — keeled sloop with mainsail, jib, boom, cabin house, and portholes

### Road Network
9 landmark-connecting roads laid as terrain-draped ribbon geometry with dashed centre lines on main roads:

| Road | Type | Route |
|---|---|---|
| Port Road | Tertiary | Port → Public Market |
| Main Street | Tertiary | Public Market → Municipal Hall (via SOEMCO) |
| Poblacion Road | Tertiary | Municipal Hall → Plaza → Church |
| Commercial Street | Residential | Church → Sofeco Hardware → Pawnshop |
| Cross Lane | Service | Pawnshop ↔ Sofeco Store |
| School Road | Residential | Pawnshop → Elementary School |
| Hospital Road | Residential | Elementary School → Hospital |
| High School Road | Residential | Main Street → National High School |
| Beach Road | Tertiary | High School → Taruc Pool → Puyangi Beach |

### Animated NPCs
Sprite-based pedestrians near every building (2–6 per landmark, scaled by foot-traffic):
- 64×128 px procedural canvas texture with black outline pass, vivid shirt/pants/skin/hair colours
- **Idle state** — breathing sway with disc pulse
- **Walking state** — terrain-sampled wandering path, walking bob, automatic sprite flip
- Coloured ground indicator disc for aerial visibility
- Smooth idle ↔ walk state machine with per-NPC randomised timers

### Terrain
- **160 × 160 unit** area (≈ 1.6 km × 1.6 km, 1 unit = 10 m)
- Procedural height map: shore factor, inland hill factor, detail noise
- 2048 × 2048 px baked texture with painted roads, building pads, vegetation zones, and urban blocks
- Sandy beach patch at Puyangi (z = 38–50, x = 22–32)
- Pool clearing at Taruc via painted vegetation patch
- 256 × 256 geometry segments

### Ocean & Atmosphere
- **Custom GLSL water shader** — animated ocean waves, specular sun reflection, Fresnel transparency
- **Three.js Sky shader** — tuned for a clear aerial view (turbidity = 0, no Mie scatter)
- No scene fog — full visibility across the island
- ACES Filmic tone mapping, sRGB colour space

### Interactive UI
- **Click any building** — camera flies in to an oblique close-up; click again or click empty terrain to deselect
- **HUD** — full landmark list with category icons; click to jump to any location
- **Info panel** — slides in with name, category, and description
- **CSS2D labels** — float above every building, always face camera
- **OrbitControls** — damped orbit, pan, zoom (min 4 → max 280 units)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router, Turbopack) |
| 3D Engine | Three.js r184 |
| Language | TypeScript |
| Styling | Tailwind CSS |
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

### Controls

| Action | Input |
|---|---|
| Orbit | Left-drag |
| Pan | Right-drag |
| Zoom | Scroll wheel |
| Select landmark | Left-click building |
| Deselect | Left-click empty area |
| Jump to landmark | Click in HUD list |

---

## File Structure

```
components/
  scene/
    sceneSetup.ts       Scene, camera, WebGLRenderer, directional + hemisphere lights
    terrain.ts          Procedural height map mesh + baked 2048px texture
    water.ts            Custom GLSL ocean shader (waves, Fresnel, sun specular)
    sky.ts              Three.js Sky atmospheric shader
    roads.ts            Road ribbon geometry with terrain draping + centre-line dashes
    markers.ts          All 14 landmark 3D building models
    boats.ts            Port vessels — bangkas, motorboats, sailing yacht
    npcs.ts             Animated pedestrian sprites with idle/walk state machine
    vegetation.ts       Trees, palms, and foliage instances
    labels.ts           CSS2D floating building labels
    animation.ts        Camera fly-to, building hover/select animation
    locations.ts        Landmark data (id, name, description, position, category)
    types.ts            Shared TypeScript interfaces (LocationData, BuildingGroup)
    postprocessing.ts   EffectComposer render pipeline (RenderPass → OutputPass)
  IslandViewer.tsx      Main scene orchestrator and React component
  InfoPanel.tsx         Selected-building slide-in info panel
  HUD.tsx               Landmark list overlay
app/
  layout.tsx            Next.js root layout + metadata + SVG favicon
  page.tsx              Root page (renders IslandViewer)
  globals.css           Global Tailwind base styles
public/
  favicon.svg           App icon — island + location pin on ocean background
```

---

## Building for Production

```bash
npm run build
npm start
```

Or deploy instantly to [Vercel](https://vercel.com) — zero configuration required for Next.js.
