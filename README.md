# Live Automation Lab & 3D Interactive AI Copilot World

A cybernetic, real-time 3D simulation and autonomous multi-agent co-pilot system engineered for a 70-display hardware automation laboratory.

Built with **React**, **Three.js / React Three Fiber / Drei**, **Tailwind CSS**, **Zustand**, and **Native Web Speech & Synthesis**.

---

## 🏛️ Architecture & Swarm Coordination Flow

The project is driven by three specialized autonomous agents communicating continuously over a structured telemetry bus:

```
┌────────────────────────────────────────────────────────┐
│                   BACKEND_ORCHESTRATOR                 │
│  - 20Hz State-Machine Loop                             │
│  - Anomaly Generator & 5-Phase Repair Dispatcher       │
│  - Carrier Delay (220ms) & IR Packet Drop (8%) Sim     │
└───────────────▲────────────────────────▲───────────────┘
                │                        │
       Dispatches Orders         Telemetry & Fault Alerts
                │                        │
┌───────────────▼──────────────┐ ┌───────▼───────────────┐
│        REPAIR_AGENT          │ │       TEST_AGENT      │
│  - Navigates Drone Bot       │ │  - TMDS Clock Monitor │
│  - Acquires Optical Feed     │ │  - CRC / EDID Check   │
│  - Transmits Hex IR Codes    │ │  - Video Sync Verify  │
└───────────────▲──────────────┘ └───────▲───────────────┘
                │                        │
                └───────────┬────────────┘
                            │
              Structured JSON Log Stream
                            │
┌───────────────────────────▼────────────────────────────┐
│                    COPILOT_BRAIN_AI                    │
│  - Real-Time Matrix Context Compiler                   │
│  - Natural Language Operator Query Parser              │
│  - Dynamic Browser SpeechSynthesis & Waveform Audio    │
└───────────────────────────▲────────────────────────────┘
                            │
                    Renders Viewport
                            │
┌───────────────────────────▼────────────────────────────┐
│                   UI_3D_ARCHITECT                      │
│  - Parametric 4x3 Stand Array (12 Stands, 70 Panels)   │
│  - Procedural Chrome Drone with Rotor Accents & Lights │
│  - Split Viewport / Optical PiP Monitor (Canvas Noise) │
│  - Dynamic Camera Lerping (Follow Bot & Room Orbit)    │
└────────────────────────────────────────────────────────┘
```

---

## 🧠 Critical Thinking & Hackathon Depth Mandates

### 1. The Scalability Angle
- **Fully Parametric Grid Math**: Floor stands are mathematically distributed in 3D space centered around `(0, 0, 0)`:
  $$\text{pos}_X = \left(\text{col} - \frac{\text{cols} - 1}{2}\right) \times \text{spacing}_X$$
  $$\text{pos}_Z = \left(\text{row} - \frac{\text{rows} - 1}{2}\right) \times \text{spacing}_Z$$
- Evaluators can open the **Config** modal in the HUD to instantly scale from the default 4x3 lab room (12 stands, 70 displays) up to 5x4, 6x4, or 8x5 mega complexes without mesh collision or overlap.

### 2. The Complementary View Angle (Split Viewport System)
- A dedicated **Optical PiP Monitor** window overlays the 3D space:
  - When inspecting a healthy TV: renders SMPTE color bars with moving TMDS sync lines.
  - When inspecting an anomalous display: renders real-time pixel static/snow via `createImageData`, video tear glitches, and TMDS error banners.
  - When repairing: renders radar sweeps, IR packet stream meters, and calibration grids.

### 3. The Hardware Simulation Angle
- Real-world physical traits are modeled in the state loop:
  - **Propagation Delays**: Simulated carrier delays (default: 220ms).
  - **Network Packet Drops**: IR flash commands experience random packet loss based on a calibrated rate (default: 8%). When dropped, the drone logs `IR_PACKET_DROP_ERR` and executes preamble retries.
  - **Variable Repair Times**: Handshake losses (~2.4s), EDID corruption (~3.0s), power cycles (~3.8s), signal desync (~1.6s).

### 4. The Agent Conversation Angle
- Swarm agents communicate using structured JSON messages with `timestamp`, `sender`, `recipient`, `severity` (LOW, MEDIUM, HIGH, CRITICAL), `error_signature`, and `assigned_priority` (P0-P3).
- Displayed live in the **Swarm Comm Bus** cyber-log console with filtering and expandable JSON inspectors.

### 5. Fallback Compliance Architecture
- **Zero Asset Dependencies**: The drone, stands, TVs, and charging bench are 100% procedurally built from geometric primitives.
- **Client-Side AI Voice & Waveform**: Uses the browser's native `window.speechSynthesis` API with real-time frequency bar animations.
- **Standalone Single-File Fallback**: Included in `standalone-fallback.html` for instant presentation without build tools.

---

## 🚀 Getting Started

### Option A: Development Server (Vite + React)
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

### Option B: Production Build Preview
```bash
npm run build
npm run preview
```

### Option C: Instant Zero-Build Standalone Fallback
Open `standalone-fallback.html` directly in any web browser.

