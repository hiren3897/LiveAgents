# Live Test Automation Lab & 3D AI Creature-Bot World

A bug-free, butter-smooth 3D simulation and autonomous multi-agent co-pilot system engineered for a 70-display hardware automation laboratory.

Built with **React 18**, **Three.js (^0.169.0)**, **React Three Fiber (^8.17.10)**, **Drei (^9.114.0)**, **Tailwind CSS**, **Zustand (^4.5.5)**, and **Native Web SpeechSynthesis**.

---

## 🛡️ Critical Anti-Glitch Architecture Rules

1. **Dependency Lock**: Strictly running React 18 (`react@^18.3.1`, `react-dom@^18.3.1`), `three@^0.169.0`, `@react-three/fiber@^8.17.10`, `@react-three/drei@^9.114.0`, and `zustand@^4.5.5`. No React 19 or `@react-three/postprocessing` (avoiding shader crashes and peer dependency conflicts).
2. **Zero React Re-Renders at 60FPS**: Bot X/Z coordinates, waddle tilts, and stepping feet animations bypass React `useState`. State is maintained in Zustand and read via `useLabStore.getState()` inside `useFrame()`, mutating mesh transforms directly.
3. **Single Camera Controller**: Strictly one `<CameraControls />` from `@react-three/drei`. Never mounts `<OrbitControls />` alongside it, preventing camera fights or violent shaking.
4. **Aisle Waypoint Pathfinding (No Clipping)**: Bot calculates a 2-step Manhattan aisle path (main side walkway -> row aisle -> target screen face), stopping 1.1 units away and facing the TV. Never clips through stands.
5. **Single-Port Self-Contained Demo**: Fully in-memory state engine and zero-config local intelligent copilot fallback with zero 404 assets and zero CORS issues.

---

## 🦆 Procedural Micro-Creature Repair Bot ("BytePaws-MK1")

Crafted entirely out of procedural Three.js primitives:
- **Body**: Warm terracotta rounded capsule torso (`#e07a5f`) with cyber accents, mechanical backpack, and glowing chest status core.
- **Head & Visor**: Rounded head with dark visor and dynamic expressive glowing eyes:
  - `SLEEPING`: Sleepy horizontal lines (`- -`), head tilted down, floating `"Zzz"` animation above head.
  - `WALKING`: Wide circular bright eyes (`o o`), signature **Microduck waddle** (`Math.sin(t * 14) * 0.12`), and alternating stepping feet.
  - `REPAIRING`: Determined squinted eyes (`> <`), glowing head antenna, and visible pulsing **IR Signal Beam** cone projecting onto broken screens.
- **Overhead Status Pill**: `<Html position={[0, 2.2, 0]} center distanceFactor={10}>` floating status badge.

---

## 🏢 Physical Lab Layout (70 TVs Total)

- **4 Rows x 3 Columns Grid**: 12 floor stands.
  - 11 stands hold 6 thin TV displays each (3 front `+Z`, 3 back `-Z`).
  - 1 stand holds 4 TV displays = **70 active screens total**.
- **Display Emissive States**:
  - `HEALTHY`: Soft emerald glow (`#10b981`) with test pattern sync bar.
  - `BROKEN`: Pulsing crimson red alert (`#ef4444`).
  - `REPAIRING`: Amber/orange intervention (`#f59e0b`).
- **8 Overhead Aisle Cameras**: 2 surveillance pods per row (West & East) tracking aisle interventions.
- **Charging Desk**: Cozy corner maintenance desk and glowing charging pad at `[-8, 0, -7]`.

---

## 🤖 Multi-Agent Swarm Roles

1. **`AGENT_WORLD_3D`**:
   - Builds parametric 4x3 lab floor, 12 stands (70 TVs), 8 cameras, desk, and `<CreatureBot />`.
   - Manages smooth `<CameraControls />` transitions ("Auto-Follow Bot" & "Free Orbit" modes).
   - Renders Picture-in-Picture **"Live Aisle Camera Feed"** with canvas noise and scanline effects.
2. **`AGENT_LAB_SIMULATOR`**:
   - Central state machine in `src/store/labStore.ts`.
   - Autonomous Test Runner agent detecting failures (`ERR_HDMI_LOST`, `ERR_BUFFER_LOCK`, `ERR_PWR_INVERTER`, `ERR_EDID_CRC`, etc.) and emitting structured JSON tickets.
   - 6-phase repair sequence: `DISPATCHED` -> `WALKING_TO_STAND` -> `SCANNING_VIA_ROW_CAMERA` -> `SENDING_IR_SIGNAL` -> `VERIFYING_FIX` -> `RETURNING_TO_DESK` -> `SLEEPING`.
   - Judge HUD controls: **"Inject Fault"** button and **"1x / 2x Speed"** toggle.
3. **`AGENT_COPILOT_VOICE`**:
   - Right-hand interactive copilot sidebar with reactive SVG avatar face synced with 3D bot mood.
   - Live Agent-to-Agent Comms stream with expandable structured JSON tickets.
   - Text & Voice (`window.speechSynthesis`) interactive chat answering questions about lab status, row diagnostics, and repair progress.

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Start Vite Dev Server
npm run dev

# Production Build
npm run build
npm run preview
```
Visit [http://localhost:5173](http://localhost:5173).
