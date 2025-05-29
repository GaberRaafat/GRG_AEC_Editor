# AEC Vision - Architectural Viewer & Editor

**AEC Vision** is a browser-based 2D/3D viewer and editor for architectural walls, powered by Three.js and TypeScript. The tool enables users to create, view, and manage architectural wall layouts interactively.

---

## 🚀 Features

### ✅ 2D/3D View Switching

* Seamlessly toggle between a 2D orthographic layout and a fully textured 3D perspective scene.

### 🧱 Wall Drawing Tool

* Draw walls interactively in 2D.
* Walls appear as textured 3D boxes in 3D mode.
* Continuous wall drawing (polygon style) is supported.
* ESC or double-click to end drawing mode.

### 📐 Wall Properties

* Each wall has metadata:

  * Start and end points (x, y)
  * Length
  * Angle (in radians)
* A live-updating list displays all wall properties.

### 🔍 Zoom to Fit

* Automatically centers and scales the camera view to fit all walls.

### ✨ 3D Realism

* Walls are textured using a brick material.
* Lighting setup includes directional and ambient light for realistic shading.

---

## 🛠 Tech Stack

* **TypeScript** for structure and safety
* **Three.js** for WebGL-based 2D/3D rendering
* **OrbitControls** for camera interaction
* **HTML/CSS** for UI

## 🧑‍💻 How to Use

1. **Start the app** (ensure a local server is running for Three.js texture loading).
2. Use the toolbar to:

   * Toggle 2D/3D mode
   * Enable/disable wall drawing
   * Zoom to fit
3. In 2D mode:

   * Click to place points.
   * Click multiple times to create a wall chain.
   * Double-click or press ESC to end the drawing session.
4. Hover or right-click walls to highlight/select.


## 👤 Author

AEC Software developer / Gaber Raafat Gaber
