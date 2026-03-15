# Facade Panel Layout Page

## Perforated Panel Placement System

This page allows users to apply **perforated panels onto a 3D facade model**.

The goal is to simulate a simplified **architectural facade design tool** where users can place perforated metal panels on building surfaces.

Users should be able to:

1. Upload a building facade model
2. Select a facade plane
3. Choose panel types
4. Adjust perforation patterns
5. Apply materials
6. Preview panels in real-time
7. Export the final facade design

---

# Technology Stack

Frontend Framework

SvelteKit

3D Engine

Three.js

3D Model Loaders

```text id="3drg0c"
GLTFLoader
OBJLoader
```

Geometry Processing

Custom TypeScript modules

Rendering Optimization

```text id="q4jv8n"
InstancedMesh
BufferGeometry
```

---

# Supported Model Formats

Users must be able to upload:

```text id="b8chxg"
OBJ
GLB
GLTF
```

After upload:

1. Parse model
2. Compute bounding box
3. Center model
4. Scale model if needed
5. Add to Three.js scene

Pipeline

```text id="tkscyg"
upload model
      ↓
parse geometry
      ↓
compute bounding box
      ↓
center model
      ↓
render in scene
```

---

# Page Layout

Left side

Control panel.

Right side

3D viewport.

Viewport must support:

```text id="az7wwv"
OrbitControls
Zoom
Pan
Rotate
```

---

# Scene Setup

Three.js scene should contain:

Camera

```text id="p4zpgk"
PerspectiveCamera
```

Lights

```text id="gkh0p6"
AmbientLight
DirectionalLight
```

Objects

```text id="1zz0o0"
FacadeModel
PanelInstances
GroundPlane
```

---

# User Workflow

```text id="9r3k8l"
Upload facade model
        ↓
Select facade plane
        ↓
Choose panel types
        ↓
Adjust perforation pattern
        ↓
Apply materials
        ↓
Preview facade
        ↓
Export design
```

---

# Step 1 — Upload Facade Model

User uploads a building facade model.

Supported formats

```text id="z2k9ph"
OBJ
GLB
GLTF
```

After upload:

• center model
• compute bounding box
• enable interaction

---

# Step 2 — Select Facade Plane

User must choose which facade surface should receive panels.

Selection method

Raycasting.

Algorithm

```text id="2e9dfp"
mouse click
      ↓
raycast from camera
      ↓
intersect mesh
      ↓
detect face normal
      ↓
highlight selected plane
```

Selected surface should show:

• highlighted overlay
• grid preview

---

# Plane Data Structure

```text id="8vm0db"
FacadePlane
{
    origin
    normal
    width
    height
}
```

---

# Step 3 — Panel Customization

User chooses panel types.

Provide **three predefined panels**.

Example

```text id="u3fydv"
Panel A
Panel B
Panel C
```

Panels differ by:

```text id="r2k3xb"
perforation pattern
slot shape
density
```

User can select:

```text id="1y3yrm"
single panel
or
combination of panels
```

Example combinations

```text id="jvty2v"
A
B
C
A+B
B+C
A+B+C
```

---

# Panel Dimensions

Example

```text id="k7l8ms"
panelWidth = 1000mm
panelHeight = 1000mm
panelThickness = 3mm
```

Panels should tile across the facade.

---

# Panel Layout System

Panels must repeat across the selected plane.

Algorithm

```text id="9pjpzz"
selected plane
      ↓
calculate plane dimensions
      ↓
divide into grid
      ↓
place panel instances
```

Example grid

```text id="n8mxyg"
10 × 6 panels
```

Panels should use:

```text id="f4u4p9"
THREE.InstancedMesh
```

---

# Panel Geometry Constraint System

Panels must **never deform**, regardless of the facade shape.

Panels represent **rigid metal sheets**.

Rules

```text id="p3od0s"
facade may be curved
panels must remain flat
```

Panels may:

```text id="ak7yfw"
translate
rotate
```

Panels must never:

```text id="wfg31d"
bend
stretch
warp
```

---

# Panel Placement on Surface

For each panel position:

1. project grid point onto facade
2. detect surface normal
3. align panel orientation

Algorithm

```text id="l4bl59"
gridPosition
      ↓
raycast to facade
      ↓
get intersection point
      ↓
get surface normal
      ↓
align panel rotation
```

Pseudo code

```text id="v6umq1"
hit = raycast(gridPosition)

panel.position = hit.point
panel.lookAt(hit.point + hit.normal)
```

---

# Curved Facade Handling

If facade is curved:

Panels must remain flat.

Instead:

```text id="45h2n5"
increase panel count
reduce panel size
approximate curvature
```

This mimics real architectural cladding systems.

---

# Step 4 — Perforation Controls

User can adjust perforation parameters.

Controls

```text id="xf3g4h"
perforationDensity
holeSize
patternScale
patternType
```

Preview patterns

```text id="svh7wa"
0%
20%
40%
60%
```

When parameters change:

```text id="qvnyxq"
regenerate panel geometry
update instanced mesh
refresh preview
```

---

# Step 5 — Materials

User can assign panel materials.

For now simulate materials using colors.

Material presets

```text id="klp2ru"
Steel
Aluminium
Titanium
Bronze
```

Example colors

```text id="6ntrw3"
Steel      #7A7A7A
Aluminium  #BFC1C2
Titanium   #8F8F8F
Bronze     #8C6239
```

Three.js material

```text id="q6ypkp"
MeshStandardMaterial
```

Recommended settings

```text id="9yoylq"
metalness = 1
roughness = 0.3
```

---

# Scene Object Structure

```text id="yzs3ad"
Scene
 ├── FacadeModel
 ├── PanelSystem
 │      ├── PanelInstances
 │      └── PerforationMeshes
 └── GroundPlane
```

---

# Panel Data Structure

```text id="tq1vdi"
Panel
{
    width
    height
    thickness
    perforationPattern
}
```

Panel instance

```text id="d4ceev"
PanelInstance
{
    position
    rotation
    panelType
}
```

---

# Performance Requirements

The system must support:

```text id="j5r65b"
1000+ panels
50000+ perforations
```

Optimization techniques

```text id="dc7vkh"
InstancedMesh
shared geometry
lazy updates
```

---

# UI Controls

Left panel should contain:

```text id="sxb63s"
Select Plane
Panel Customization
Perforation
Material / Finish
Export Image
Save
```

---

# Export

Allow exporting:

```text id="m0yysl"
Rendered image
GLB model
SVG perforation layout
```

---

# Future Extensions

Possible improvements

```text id="yt69pk"
multi facade sides
adaptive perforation
panel spacing control
randomized panels
wind load simulation
```

---

# Design Goal

Create a **browser-based parametric facade design tool** where users can quickly prototype perforated architectural panels.

The system should behave like a simplified **generative architecture tool**, similar to Grasshopper but accessible directly in the browser.
