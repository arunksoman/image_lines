# ImageLines Playground — Copilot Instructions

## What is this about?

# ImageLines Playground

## Generative Perforated Facade Designer

A browser-based generative design tool inspired by Zahner's ImageLines system.
The application converts images into **flowing perforated slot patterns** and visualizes them as **3D architectural metal panels**.

The system should allow users to upload an image, generate perforation patterns, preview them in 3D, adjust parameters interactively, and export fabrication-ready files.

---

# Project Goals

Build a **web-based generative facade design playground** with the following capabilities:

1. Convert an image into a perforated slot pattern
2. Visualize the panel in real-time using WebGL
3. Allow parametric control of the pattern
4. Export both **vector fabrication files** and **3D models**

Primary goal: **fast interactive exploration of perforated facade patterns.**

---

# Technology Stack

Frontend framework
SvelteKit

Rendering
Three.js

Image Processing
Canvas API

Geometry Processing
Custom TypeScript modules

State Management
Svelte stores

3D Export
Three.js GLTFExporter

Vector Export
SVG generator

Optional libraries

three-bvh-csg
three-csg-ts
simplex-noise

---

# System Architecture

Pipeline

```
Image Upload
      ↓
Image Processing
      ↓
Grayscale Map
      ↓
Line Field Generator
      ↓
Perforation Generator
      ↓
Geometry Builder
      ↓
Three.js Renderer
      ↓
Export Engine
```

Each stage must be modular so algorithms can be replaced independently.

---

# Core Modules

## Image Processing

Responsibilities

• accept uploaded image
• resize image to working resolution
• convert to grayscale
• produce brightness map

Brightness formula

```
brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255
```

Output structure

```
brightness[x][y] → value between 0 and 1
```

Recommended resolution

```
512 x 512
```

---

# Line Field Generator

Generate continuous lines across the image.

These lines will later contain perforations.

Base algorithm

```
for y from 0 to height step lineSpacing
    create new line
    sample noise field
    offset line position
```

Parameters

```
lineSpacing
lineCurvature
noiseStrength
flowDirection
```

Future improvement

Use image gradients so lines follow image contours.

Techniques

• Sobel gradient
• curl noise
• flow field

---

# Perforation Generator

Convert brightness into slot perforations.

Dark areas → large slots
Light areas → small slots

Example mapping

```
slotWidth = lerp(maxSlotWidth, minSlotWidth, brightness)
```

Slot parameters

```
minSlotWidth
maxSlotWidth
slotLength
slotSpacing
slotRotation
```

Slots must not overlap.

---

# Data Model

Line structure

```
Line
  points[]
  slots[]
```

Slot structure

```
{
    x
    y
    width
    length
    rotation
}
```

---

# Geometry Builder

Convert slot data into Three.js geometry.

Preferred approach

```
InstancedMesh
```

Reason

Perforated panels may contain **10,000–50,000 slots**.

Instancing keeps rendering fast.

Geometry types

```
panelGeometry
slotGeometry
```

Slot geometry example

```
BoxGeometry(width, length, thickness)
```

---

# Three.js Scene

Scene components

Camera
PerspectiveCamera

Lighting

AmbientLight
DirectionalLight

Objects

```
panelMesh
slotInstances
backlightPlane
```

Controls

OrbitControls

Features

• zoom preview
• rotate panel
• distance viewing simulation

---

# Visual Modes

Day Mode

Dark studio backdrop with strong directional lighting — showroom presentation.

Daylight Mode

Bright white outdoor lighting — natural sunlight simulation with light background.

Night Mode

Backlit panel to visualize light passing through perforations.

Distance Mode

Apply blur or distance fade to simulate architectural viewing distance.

---

# UI Controls

Control panel should expose the following parameters

```
Upload Image
Line Density
Line Curvature
Noise Amount
Slot Min Width
Slot Max Width
Slot Length
Slot Spacing
Panel Width
Panel Height
Panel Thickness
```

Changes should trigger reactive updates.

---

# Export System

The application must support exporting generated patterns.

Supported exports

```
SVG
GLB
OBJ (optional)
STL (optional)
```

Primary formats

```
SVG
GLB
```

---

# SVG Export

SVG should contain slot shapes.

Example

```
<rect x="" y="" width="" height="" />
```

Purpose

CNC punching or laser cutting.

Units should be **millimeters**.

---

# 3D Export (GLB)

Export a 3D perforated panel.

Recommended format

```
GLB
```

GLB is the binary form of glTF.

Supported by

• Blender
• Rhino
• Unreal Engine
• Unity
• Three.js

---

# 3D Geometry Strategy

Two approaches

Preview Mode

Slots rendered as instanced meshes.

Export Mode

Generate real perforated panel using boolean subtraction.

Pipeline

```
generate lines
    ↓
generate slots
    ↓
create slot meshes
    ↓
create panel mesh
    ↓
boolean subtract slots
    ↓
export mesh
```

Recommended libraries

```
three-bvh-csg
three-csg-ts
```

---

# Panel Parameters

```
panelWidth
panelHeight
panelThickness
panelMargin
```

Example

```
panelWidth = 2000 mm
panelHeight = 1000 mm
panelThickness = 3 mm
```

For glTF export convert units to **meters**.

---

# GLTF Export Implementation

Use Three.js GLTFExporter.

Example

```
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter'

const exporter = new GLTFExporter()

exporter.parse(
  scene,
  (result) => {
      saveArrayBuffer(result, "panel.glb")
  },
  { binary: true }
)
```

Export should include only

```
PerforatedPanelMesh
```

Exclude

```
lights
cameras
helpers
UI objects
```

---

# Metadata

Include fabrication metadata inside glTF extras.

Example

```
{
  "panelWidth": 2000,
  "panelHeight": 1000,
  "panelThickness": 3,
  "slotCount": 25000
}
```

---

# Performance Requirements

System should support

```
10,000 – 50,000 perforations
```

Techniques

• InstancedMesh
• BufferGeometry
• avoid recreating geometry unnecessarily

---

# Folder Structure

```
src

components
    ControlPanel.svelte
    CanvasView.svelte

stores
    settings.ts

lib

image
    grayscale.ts
    sampler.ts

algorithms
    lineField.ts
    perforation.ts

geometry
    slotBuilder.ts
    panelBuilder.ts

three
    scene.ts
    camera.ts
    renderer.ts
    lighting.ts

export
    svgExport.ts
    gltfExport.ts
```

---

# Development Milestones

Phase 1

Basic system

• image upload
• grayscale conversion
• horizontal line generator
• simple perforations
• 3D preview

---

Phase 2

Interactive controls

• parameter sliders
• live regeneration

---

Phase 3

Advanced pattern generation

• noise flow lines
• gradient based flow

---

Phase 4

Export system

• SVG export
• GLB export

---

Phase 5

Visual realism

• backlighting
• shadows
• material presets

---

# Future Extensions

Multi-panel facades

```
Facade
   Panel_01
   Panel_02
   Panel_03
```

Fabrication constraints

```
minimum hole spacing
minimum metal thickness
edge margins
```

Advanced algorithms

• Poisson disk sampling
• edge-aware perforation
• adaptive slot density

---

# Visual Goal

The perforated panel should reconstruct the original image when viewed from distance.

Pipeline example

```
portrait.jpg
    ↓
perforation pattern
    ↓
3D metal panel
    ↓
distance view
    ↓
recognizable portrait
```

---

# Design Principlesa

1. Real-time interaction
2. Modular algorithms
3. Fabrication friendly output
4. High-performance rendering


## Project Overview

SvelteKit 2 + Svelte 5 single-page app that converts raster images into perforated metal facade panel designs. The pipeline is: **Image → Grayscale brightness map → Flow lines (simplex noise) → Slot perforations → Three.js 3D preview**. Exports to SVG (fabrication) and GLB (3D model). SSR is disabled (`+page.ts` exports `ssr = false`); this is a purely client-side app.

## Tech Stack & Conventions

- **Svelte 5 runes** — all components use `$state()`, `$props()`, `$effect()`. Runes mode is enforced globally via `svelte.config.js` `dynamicCompileOptions`. Never use Svelte 4 stores or `$:` reactive declarations.
- **TypeScript** throughout (`strict` mode). Interfaces over types for data shapes.
- **Three.js** for WebGL rendering. Scene lifecycle managed in `src/lib/three/scene.ts` via a factory function (`createSceneManager`) returning a plain object API — not a class.
- **No test framework** is configured. No component library or CSS framework — styles are component-scoped `<style>` blocks.
- Import aliases: use `$lib/` for anything under `src/lib/`.

## Architecture & Data Flow

```
+page.svelte          — Orchestrator: owns settings state, wires pipeline stages
├─ ControlPanel       — UI sidebar: image upload, sliders, export buttons (callback props)
├─ CanvasView         — Three.js canvas container, binds SceneManager
└─ Pipeline functions  — Pure functions called in sequence:
   loadImage()        → ImageData (sampler.ts)
   toBrightnessMap()  → BrightnessMap (grayscale.ts) — Float32Array, row-major
   generateLineField()→ FlowLine[] (lineField.ts) — simplex noise displaced lines
   generatePerforations() → Slot[] (perforation.ts) — brightness-to-slot-width mapping
```

**Key patterns:**
- State lives in `+page.svelte` via `createSettings()` (runes-based reactive store in `stores/settings.svelte.ts`). Child components receive values as props and communicate upward via callback props (`onUpdate`, `onExportSvg`, etc.).
- Algorithm functions (`lineField.ts`, `perforation.ts`) are **pure** — they take params and return data arrays. No side effects or global state.
- All coordinates are **normalized 0–1** in the pipeline, converted to mm at the export/rendering boundary.
- Physical units are **millimeters** everywhere except GLB export (converts mm → meters for glTF compliance).

## Key Directories

- `src/lib/algorithms/` — Pure computation: line field generation, perforation slot placement
- `src/lib/image/` — Image loading (`sampler.ts`) and brightness extraction (`grayscale.ts`)
- `src/lib/three/` — Three.js scene manager (renderer, camera, controls, lighting, visual modes)
- `src/lib/geometry/` — Three.js geometry builders for panel and slot meshes
- `src/lib/export/` — SVG and GLB file generation and download
- `src/lib/stores/` — Reactive settings state (Svelte 5 runes)
- `src/lib/components/` — `CanvasView.svelte` (3D viewport) and `ControlPanel.svelte` (sidebar UI)

## Development

```sh
npm install
npm run dev          # Vite dev server
npm run build        # Production build
```

## Important Implementation Details

- **Debounced regeneration**: Slider changes trigger `scheduleRegenerate()` (120ms debounce) in `+page.svelte`. Visual-mode-only changes skip regeneration.
- **InstancedMesh**: Slots (10k–50k) are rendered as `THREE.InstancedMesh` for performance. See `scene.ts` `updateSlots()`.
- **Visual modes**: Four modes (day/daylight/night/distance) adjust lighting, colors, fog, and camera — implemented in `scene.ts` `applyVisualMode()`.
- **SVG export** produces fabrication-ready output with mm units and `rotate()` transforms per slot.
- Slot width is **inversely mapped to brightness**: dark image areas → large slots, light areas → small slots (`perforation.ts`).
