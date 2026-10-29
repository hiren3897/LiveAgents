import React, { useState } from 'react';
import { useLabStore } from '../../store/useLabStore';
import { 
  Activity, 
  Cpu, 
  Sliders, 
  Zap, 
  RotateCcw, 
  Grid, 
  Wifi, 
  Clock, 
  Eye, 
  Layers,
  Sparkles,
  Server
} from 'lucide-react';

export const LabStatsOverlay: React.FC = () => {
  const dimensions = useLabStore(state => state.dimensions);
  const updateDimensions = useLabStore(state => state.updateDimensions);
  const tvs = useLabStore(state => state.tvs);
  const bot = useLabStore(state => state.bot);
  const hardwareConfig = useLabStore(state => state.hardwareConfig);
  const setHardwareConfig = useLabStore(state => state.setHardwareConfig);
  const triggerManualAnomaly = useLabStore(state => state.triggerManualAnomaly);
  const resetAllTvs = useLabStore(state => state.resetAllTvs);
  const cameraMode = useLabStore(state => state.cameraMode);
  const setCameraMode = useLabStore(state => state.setCameraMode);

  const [showConfigModal, setShowConfigModal] = useState(false);

  const totalTvs = Object.keys(tvs).length;
  const healthyCount = Object.values(tvs).filter(t => t.status === 'healthy').length;
  const failingCount = Object.values(tvs).filter(t => t.status === 'failing').length;
  const repairingCount = Object.values(tvs).filter(t => t.status === 'repairing').length;
  const healthPercent = totalTvs > 0 ? ((healthyCount / totalTvs) * 100).toFixed(1) : '100';

  return (
    <>
      {/* Top Header Navigation HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10 font-mono">
        {/* Left: Brand & Lab Identity */}
        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-xl border border-cyan-500/40 bg-[#080d1a]/90 backdrop-blur-md shadow-[0_0_25px_rgba(0,0,0,0.8)]">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.4)]">
            <Server className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-wider text-slate-100">
                LIVE AUTOMATION LAB
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 font-semibold">
                3D COPILOT WORLD
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>{dimensions.rows}x{dimensions.cols} Stand Matrix ({totalTvs} Displays)</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-bold">{healthPercent}% Nominal</span>
            </div>
          </div>
        </div>

        {/* Center: Live Metric Badges */}
        <div className="pointer-events-auto hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-[#080d1a]/85 backdrop-blur-md text-xs">
          {/* Healthy */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-bold">{healthyCount}</span>
            <span className="text-[10px] text-slate-400">HEALTHY</span>
          </div>

          {/* Failing */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span className="font-bold">{failingCount}</span>
            <span className="text-[10px] text-slate-400">FAILING</span>
          </div>

          {/* Repairing */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-spin" />
            <span className="font-bold">{repairingCount}</span>
            <span className="text-[10px] text-slate-400">INTERVENTIONS</span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          {/* Camera View Toggle */}
          <div className="flex items-center gap-1 text-[11px]">
            <button
              onClick={() => setCameraMode('ORBIT_ROOM')}
              className={`px-2 py-1 rounded transition-all ${
                cameraMode === 'ORBIT_ROOM' 
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Orbit View
            </button>
            <button
              onClick={() => setCameraMode('FOLLOW_BOT')}
              className={`px-2 py-1 rounded transition-all ${
                cameraMode === 'FOLLOW_BOT' 
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Follow Bot
            </button>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Inject Anomaly */}
          <button
            onClick={() => triggerManualAnomaly()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-900 to-rose-700 hover:from-rose-800 hover:to-rose-600 border border-rose-500/60 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)] active:scale-95"
            title="Trigger Anomaly on Random TV"
          >
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            <span>Inject Fault</span>
          </button>

          {/* Global Reset */}
          <button
            onClick={resetAllTvs}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all active:scale-95"
            title="Reset All Displays to Healthy"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Parametric Lab Config Modal Toggle */}
          <button
            onClick={() => setShowConfigModal(!showConfigModal)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 text-xs font-semibold transition-all shadow-[0_0_15px_rgba(0,243,255,0.2)]"
            title="Hardware Simulation & Parametric Grid Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Config</span>
          </button>
        </div>
      </div>

      {/* Parametric Grid & Hardware Simulation Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-mono">
          <div className="w-[480px] rounded-2xl border border-cyan-500/50 bg-[#090e1c] shadow-[0_0_50px_rgba(0,243,255,0.3)] p-5 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">PARAMETRIC MATRIX & HARDWARE MOCK</h3>
              </div>
              <button 
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Scalability Presets */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5 uppercase font-bold tracking-wider">
                  Geometric Matrix Scale (Judge Stress-Test)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateDimensions(4, 3, 7.5, 6.5)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      dimensions.rows === 4 && dimensions.cols === 3
                        ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold">4x3 Standard Lab</div>
                    <div className="text-[10px] text-slate-500">12 Stands · 70 Displays</div>
                  </button>

                  <button
                    onClick={() => updateDimensions(5, 4, 7.0, 6.0)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      dimensions.rows === 5 && dimensions.cols === 4
                        ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold">5x4 High-Density</div>
                    <div className="text-[10px] text-slate-500">20 Stands · 100 Displays</div>
                  </button>

                  <button
                    onClick={() => updateDimensions(6, 4, 7.0, 6.0)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      dimensions.rows === 6 && dimensions.cols === 4
                        ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold">6x4 Enterprise Bay</div>
                    <div className="text-[10px] text-slate-500">24 Stands · Dynamic Layout</div>
                  </button>

                  <button
                    onClick={() => updateDimensions(8, 5, 6.5, 5.5)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      dimensions.rows === 8 && dimensions.cols === 5
                        ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold">8x5 Mega Complex</div>
                    <div className="text-[10px] text-slate-500">40 Stands · Parametric Space</div>
                  </button>
                </div>
              </div>

              {/* Hardware Simulation Angle: Packet Drop Rate */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">IR Flashing Packet Drop Simulation:</span>
                  <span className="text-cyan-400 font-bold">{(hardwareConfig.packetDropRate * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.30"
                  step="0.02"
                  value={hardwareConfig.packetDropRate}
                  onChange={(e) => setHardwareConfig({ packetDropRate: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="text-[10px] text-slate-500 mt-1">
                  Mocks physical 433MHz carrier interference and IR packet loss, forcing the drone to execute preamble retries.
                </div>
              </div>

              {/* Hardware Simulation Angle: Signal Propagation Delay */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Signal Propagation Delay:</span>
                  <span className="text-cyan-400 font-bold">{hardwareConfig.propagationDelayMs} ms</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="800"
                  step="25"
                  value={hardwareConfig.propagationDelayMs}
                  onChange={(e) => setHardwareConfig({ propagationDelayMs: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Autonomous Anomaly Loop Toggle */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Autonomous Anomaly Loop</div>
                  <div className="text-[10px] text-slate-500">Periodically causes random TV faults for live demonstration</div>
                </div>
                <button
                  onClick={() => setHardwareConfig({ isSimulationRunning: !hardwareConfig.isSimulationRunning })}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    hardwareConfig.isSimulationRunning 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' 
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {hardwareConfig.isSimulationRunning ? 'ACTIVE' : 'PAUSED'}
                </button>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all text-xs"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

