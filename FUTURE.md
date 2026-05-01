# Socorro 3D — Future Enhancements

Ideas for taking the living digital twin further. Grouped by theme, ordered roughly by feasibility vs. emotional impact.

---

## Community & Social

### Real-Time Multiplayer Presence
Replace the ghost visitor simulation with actual live cursors — users connected at the same time appear as named coloured dots wandering the map. Simple WebSocket or Supabase Realtime broadcast of camera position. No backend state needed beyond ephemeral presence. The first time a local sees a family member's name appear on the map, the project transcends demo.

### Community Story Submissions
Let residents attach their own stories to landmarks via a short form. Submissions go into a moderation queue; approved entries appear as a second ring of discovery orbs in a distinct community colour. A real oral-history archive, crowd-sourced without extra infrastructure cost.

### Barangay Boundaries & Population Heat Map
Overlay the 14 barangays of Socorro as semi-transparent polygon regions. Toggle a heat map of population density, voter turnout, or typhoon risk per barangay — useful for LGU planning presentations and for students learning local government.

### Visitor Log / Guestbook
When a user clicks a landmark, offer a lightweight "sign the guestbook" — name + one sentence. Stored in a KV or SQLite edge database. The info panel shows the three most recent entries. Creates a sense of shared pilgrimage.

---

## Heritage & Education

### Historical Photo Overlays
At selected landmarks, a "1980s / today" toggle fades between a historical photograph and the 3D view. The photo is a flat plane positioned at the same angle as the building. Sources: LGU archives, National Archives of the Philippines, Facebook community groups.

### Virtual Heritage Walk (Guided Tour Mode)
A scripted cinematic tour that auto-pilots the camera between 6 key landmarks, pausing at each with a narrated audio clip (Filipino/English) and a short text story. Triggered by a "Take the Tour" button. Shareable as a link that starts the tour from the beginning — useful for school presentations and diaspora relatives.

### Timeline Slider (Decade View)
A horizontal timeline on the HUD (1950 → present). Dragging it morphs the scene: roads disappear, buildings dissolve back to empty lots, the port shrinks, vegetation fills in. Reconstructed from oral records and satellite archive images. Requires per-decade building data but even a two-state (pre-1990 / current) version would be powerful.

### School Curriculum Integration
A "Classroom Mode" toggle that adds quiz hotspots above buildings — multiple-choice questions about Socorro geography, history, and civics, answered by clicking the correct building. Generates a printable score report. Designed for Grade 4–6 Araling Panlipunan classes.

---

## Environmental & Scientific

### Real-Time Typhoon Track Overlay
When PAG-ASA issues a typhoon advisory affecting Surigao del Norte, fetch the official GeoJSON track and render it as an animated path cone approaching or passing over the island. Toggle between historical tracks (Odette 2021, Pablo 2012) for hazard education.

### Flood Risk Visualization
Import NAMRIA or PHIVOLCS elevation + flood hazard data and render 5-year / 25-year / 100-year flood inundation zones as animated rising water. Critical for DRRM planning, barangay preparedness training, and LGU grant applications.

### Coral Reef & Marine Layer
The bay east of the port is the entry point to the Sohoton Natural Bridge and Naked Island marine sanctuary. Add an underwater camera mode — descend below the water surface to see a procedurally generated coral reef with fish sprites and the bioluminescent jellyfish from the folklore layer.

### Seasonal Vegetation Change
Trees change texture between wet season (June–November, lush dark green) and dry season (December–May, slightly yellowed). Matches the real Philippine calendar. Subtle but grounding — locals will notice immediately.

---

## Civic & LGU Tools

### Live Event Calendar Integration
Connect to the LGU's Google Calendar (or a simple headless CMS like Sanity or Contentful) so that event pins auto-populate from the official schedule without a developer pushing code. LGU staff manage events through familiar tools; the map stays current automatically.

### Infrastructure Status Board
A toggleable overlay showing the status of public infrastructure: road condition (good/under repair/damaged), water service coverage, power interruption zones, internet connectivity. Sourced from LGU maintenance records. Useful for council meetings and budget planning.

### Property / Land Use Layer
Semi-transparent polygon overlay showing zoning: residential, commercial, agricultural, forest reserve, coastal buffer. Click a zone to see ordinance citation and restrictions. Supports permit processing and community planning consultations.

### Disaster Response Mode
A locked-down DRRM mode (password-protected) where responders can drop pins for evacuation centres, casualty reports, and road blockages during an active disaster. Pins sync across all DRRM staff sessions in real time. Lightweight alternative to expensive GIS platforms for a small municipality.

---

## Visual & Immersion

### Procedural Rain Shader
Full rain system: particle shader rain streaks (angled by wind direction), puddle accumulation on road surfaces (normal-map ripples), wet terrain (darkened + reflective material), distant rain curtain fog, rain audio layer with thunder. Weather transitions blend smoothly over 8 seconds.

### Interior Building Views
Click a landmark and press a "Go Inside" button — the camera cuts to a simple interior: the church nave with pew rows and altar, the market with stall vendors, the school classroom with desks. Box geometry interiors with canvas textures painted from reference photos.

### Boat Pathfinding
Give the port vessels actual routes instead of static positions. Bangkas depart the pier, cross to the fishing grounds northeast of the bay, and return. The passenger boat traces the Surigao City route and disappears over the horizon. Simple waypoint interpolation with heading rotation.

### Instanced Vegetation (Performance)
Replace the 40 individual tree meshes with `THREE.InstancedMesh` (one draw call per tree type). Enables 400+ trees without GPU overhead, filling in the hillsides and barangay coconut groves realistically.

### Dynamic Shadows
Currently shadow map is baked at load. Wire shadow map update to the day cycle — shadows rotate with the sun, becoming long and dramatic at golden hour. Requires reducing shadow map resolution to 2048 to maintain performance.

### Satellite Imagery Terrain Texture
Replace the procedurally painted terrain texture with a real Sentinel-2 or Google Earth satellite tile reprojected onto the height mesh. The coastal outlines, beach, mangrove zones, and urban density would match reality precisely.

---

## Performance & Platform

### Progressive Web App (PWA)
Service worker + manifest so the map installs as a homescreen app on mobile. Offline cache for static assets. Push notifications for upcoming events ("Socorro Fiesta starts tomorrow — visit the map!"). Low effort, high reach for local residents with limited data plans.

### Mobile Touch Optimisation
Two-finger pinch to zoom, single-finger pan, tap to select landmark. Currently the scene works on mobile but isn't optimised for it. Reduce shadow resolution, lower pixel ratio cap to 1.5 on mobile, and add touch event handlers to the HUD panels.

### LOD (Level of Detail)
Buildings beyond 60 units from camera switch to a low-poly box proxy. Trees beyond 40 units become single billboards. Cuts draw calls in half during zoomed-out aerial view, enabling smoother performance on low-end devices.

### Screenshot / Postcard Export
A "Take a Photo" button that renders a high-resolution frame (2× the canvas resolution) with a watermark: "Socorro, Surigao del Norte" and the current date. Users download a shareable image. Simple `renderer.domElement.toBlob()` + anchor download.

---

## Long-Term Vision

The map is already a **digital twin**. The natural destination is a **civic operating system** — a single URL where residents, students, LGU staff, tourists, and diaspora can all find Socorro: its past, its present, and its plans for the future. Not a government portal. Not a Facebook page. Something that feels like the island itself, rendered in light.

Every feature above serves that vision. The question is not *what to build* but *what the community needs most* — which is best answered by showing them what already exists and listening.
