import React from 'react';
import { 
  Zap, 
  RotateCcw, 
  FastForward, 
  Eye, 
  Monitor, 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw 
} from 'lucide-react';
import { useLabStore } from '../store/labStore';

export const HudOverlay: React.FC = () => {
  const tvs = useLabStore(state => state.tvs);
  const bot = useLabStore(state => state.bot);
  const simSpeed = useLabStore(state => state.simSpeed);
  const setSimSpeed = useLabStore(state => state.setSimSpeed);
  const cameraMode = useLabStore(state => state.cameraMode);
  const setCameraMode = useLabStore(state => state.setCameraMode);
  const triggerManualFailure = useLabStore(state => state.triggerManualFailure);
  const fixAllTvs = useLabStore(state => state.fixAllTvs);
  const selectedTvId = useLabStore(state => state.selectedTvId);

  const allTvs = Object.values(tvs);
  const totalTvs = allTvs.length;
  const healthyCount = allTvs.filter(t => t.status === 'HEALTHY').length;
  const brokenCount = allTvs.filter(t => t.status === 'BROKEN').length;
  const repairingCount = allTvs.filter(t => t.status === 'REPAIRING').length;
  const healthPercent = totalTvs > 0 ? ((healthyCount / totalTvs) * 100).toFixed(1) : '100';

  return (
    <header className="absolute top-3 left-3 right-[400px] flex items-center justify-between pointer-events-none z-20 font-mono select-none">
      {/* Brand & Lab Identity */}
      <div className="pointer-events-auto flex items-center gap-3 px-3.5 py-2 rounded-xl border border-sky-500/40 bg-slate-950/85 backdrop-blur-md shadow-2xl">
        <div className="p-2 rounded-lg bg-sky-950/80 border border-sky-500/50 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
          <Server className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold tracking-wider text-slate-100">
              LIVE AUTOMATION LAB
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-sky-900/60 text-sky-300 border border-sky-500/40 font-semibold">
              3D CREATURE-BOT WORLD
            </span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-2">
            <span>4x3 Matrix · 12 Stands · {totalTvs} Displays</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-bold">{healthPercent}% Nominal</span>
          </div>
        </div>
      </div>

      {/* Live Metric Badges */}
      <div className="pointer-events-auto hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950/80 backdrop-blur-md text-xs">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-bold">{healthyCount}</span>
          <span className="text-[10px] text-slate-400">HEALTHY</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-950/50 border border-rose-500/30 text-rose-300">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          <span className="font-bold">{brokenCount}</span>
          <span className="text-[10px] text-slate-400">BROKEN</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-950/50 border border-amber-500/30 text-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-spin" />
          <span className="font-bold">{repairingCount}</span>
          <span className="text-[10px] text-slate-400">REPAIRING</span>
        </div>
      </div>

      {/* Manual Judge Demo Controls */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Simulation Speed Toggle (1x / 2x) */}
        <button
          onClick={() => setSimSpeed(simSpeed === 1 ? 2 : 1)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
            simSpeed === 2 
              ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]' 
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
          }`}
          title="Toggle Simulation Speed"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span>{simSpeed}x Speed</span>
        </button>

        {/* Camera Mode Toggle */}
        <button
          onClick={() => setCameraMode(cameraMode === 'AUTO_FOLLOW' ? 'FREE_ORBIT' : 'AUTO_FOLLOW')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
            cameraMode === 'AUTO_FOLLOW' 
              ? 'bg-sky-950/80 border-sky-500/50 text-sky-300' 
              : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}
          title="Toggle Camera Follow Mode"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{cameraMode === 'AUTO_FOLLOW' ? 'Auto Follow' : 'Free Orbit'}</span>
        </button>

        {/* Trigger Random TV Failure Button (Judge Highlight) */}
        <button
          onClick={() => triggerManualFailure()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-900 to-rose-700 hover:from-rose-800 hover:to-rose-600 border border-rose-500/60 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)] active:scale-95"
          title="Simulate hardware failure on random display"
        >
          <Zap className="w-3.5 h-3.5 animate-pulse" />
          <span>Inject Fault</span>
        </button>

        {/* Fix All Button */}
        <button
          onClick={fixAllTvs}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-all active:scale-95"
          title="Restore all 70 displays to healthy"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Fix All</span>
        </button>
      </div>
    </header>
  );
};
