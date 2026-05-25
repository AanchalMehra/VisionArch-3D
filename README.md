# VisionArch 3D — AI Floor Plan to 3D Converter

Convert any 2D floor plan image into an interactive 3D model using OpenCV computer vision and React Three Fiber.

---

## Features

| Feature | Details |
|---|---|
| **Wall Detection** | Horizontal, vertical & slanted walls via Hough Line Transform |
| **Room Detection** | Contour-based enclosed room detection with auto-labelling |
| **Door/Window Detection** | Gap analysis via morphological close + XOR diff |
| **Furniture Classification** | Aspect-ratio heuristics (bed, sofa, table, chair) |
| **3D Rendering** | React Three Fiber with orbit/zoom/pan controls |
| **Roof Toggle** | Show/hide flat roof with eave trim |
| **5 Material Themes** | Modern, Warm, Concrete, Nordic, Night |
| **AI Loading Overlay** | Animated neural-net visualization during processing |
| **Detection Stats** | Live counts of walls, rooms, doors, windows, furniture |

---

## Stack

- **Backend**: Flask + OpenCV (headless) + NumPy
- **Frontend**: React + Vite + React Three Fiber + @react-three/drei

---

## Quick Start

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5000
```

### 2. Frontend (Dev)

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
# Proxies /upload → Flask automatically
```

### 3. Frontend (Built dist)

Serve the `frontend/dist` folder with any static server and point `/upload` to the Flask backend:

```bash
cd frontend/dist
npx serve .
```

Or configure your reverse proxy (nginx/caddy) to proxy `/upload` to `:5000`.

---

## How It Works

```
Upload PNG/JPG
     │
     ▼
Flask /upload endpoint
     │
     ▼
OpenCV Pipeline:
  1. Grayscale + Gaussian blur
  2. Binary threshold (global + adaptive)
  3. Horizontal morphological open → HoughLinesP → horizontal walls
  4. Vertical morphological open  → HoughLinesP → vertical walls
  5. Canny edges → HoughLinesP (fine angle) → diagonal walls
  6. Segment merging (proximity + overlap grouping)
  7. Morphological close - original → gap mask → doors/windows
  8. Contour detection on inverted mask → rooms
  9. Blob aspect-ratio classification → furniture
     │
     ▼
JSON response: { walls, openings, rooms, furniture, stats }
     │
     ▼
React Three Fiber:
  - Wall meshes (BoxGeometry, aligned to coordinates)
  - Door/window openings (colored frames, glass panel)
  - Room floor highlights + floating text labels
  - Detailed furniture meshes (bed with headboard, sofa with arms, etc.)
  - Optional flat roof with eave trim
  - 5 material/lighting themes
```

---

## API

### POST /upload

**Request**: `multipart/form-data` with `file` field (PNG, JPG, JPEG, WEBP, BMP)

**Response**:
```json
{
  "image_size": { "width": 800, "height": 600 },
  "scene_size": 10.0,
  "walls": [
    { "position": [x, y, z], "size": [w, h, d], "rotation": [0,0,0], "type": "wall" }
  ],
  "openings": [
    { "type": "door", "position": [...], "size": [...], "rotation": [...] }
  ],
  "rooms": [
    { "label": "Living Room", "center": [...], "bounds": { "x", "z", "width", "depth" } }
  ],
  "furniture": [
    { "type": "bed", "position": [...], "size": [...], "rotation": [...] }
  ],
  "stats": { "walls": 12, "rooms": 5, "doors": 4, "windows": 6, "furniture": 3 }
}
```

All coordinates are in **scene units** (0–10 range, mapped from image pixels).

---

## Tips for Best Results

- Use **black-on-white** floor plan images (architectural line drawings work best)
- Higher resolution images → more accurate wall detection
- PNG format preferred over JPEG (avoids compression artifacts on lines)
- Simple floor plans (no furniture pre-drawn) yield cleaner wall detection
