import React from 'react';
import { LabScene } from './components/LabScene';
import { HudOverlay } from './components/HudOverlay';
import { PipCameraFeed } from './components/PipCameraFeed';
import { CopilotSidebar } from './components/CopilotSidebar';
import { useLabStore } from './store/labStore';
import { Radio } from 'lucide-react';

export const App: React.FC = () => {
  const bot = useLabStore(state => state.bot);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070b14] select-none flex">
      {/* Main 3D Canvas Area */}
      <main className="relative flex-1 h-full overflow-hidden">
        {/* Fullscreen 3D Scene Layer */}
        <LabScene />

        {/* Top Header & Lab HUD */}
        <HudOverlay />

        {/* Picture-in-Picture Live Aisle Camera Feed (Top Left) */}
        <div className="absolute top-16 left-3 z-10">
          <PipCameraFeed />
        </div>

        {/* Bottom Real-Time Creature-Bot Action Ticker */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-950/85 border border-sky-500/40 backdrop-blur-md shadow-2xl text-xs font-mono text-slate-200 pointer-events-none">
          <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span className="text-sky-400 font-bold">{bot.name}:</span>
          <span>{bot.activeStepLabel}</span>
          {bot.phase !== 'SLEEPING' && (
            <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700 ml-1">
              <div 
                className="bg-sky-400 h-full rounded-full transition-all duration-200"
                style={{ width: `${Math.min(100, bot.phaseProgress)}%` }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Right-Hand Creature-Bot Copilot & Swarm Comms Sidebar */}
      <CopilotSidebar />
    </div>
  );
};
