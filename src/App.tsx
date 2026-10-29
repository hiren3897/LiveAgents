import React, { useEffect, useState } from 'react';
import { LabScene } from './components/3d/LabScene';
import { SplitViewportMonitor } from './components/ui/SplitViewportMonitor';
import { CyberLogConsole } from './components/ui/CyberLogConsole';
import { CopilotInterface } from './components/ui/CopilotInterface';
import { LabStatsOverlay } from './components/ui/LabStatsOverlay';
import { orchestrator } from './backend/Orchestrator';
import { useLabStore } from './store/useLabStore';
import { 
  Terminal, 
  Bot, 
  Camera, 
  ChevronDown, 
  ChevronUp, 
  Radio, 
  Cpu, 
  HelpCircle 
} from 'lucide-react';

export const App: React.FC = () => {
  const bot = useLabStore(state => state.bot);
  const tvs = useLabStore(state => state.tvs);
  const [activeTab, setActiveTab] = useState<'CONSOLE' | 'COPILOT' | 'SPLIT_VIEW'>('CONSOLE');
  const [isPanelVisible, setIsPanelVisible] = useState(true);

  // Initialize Backend Orchestrator state loop on mount
  useEffect(() => {
    orchestrator.start();
    return () => {
      orchestrator.stop();
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#060a14] select-none">
      {/* 1. Fullscreen 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <LabScene />
      </div>

      {/* 2. Top Header & Matrix HUD Layer */}
      <LabStatsOverlay />

      {/* 3. Floating Picture-in-Picture Optical Camera Feed (Top Right) */}
      <div className="absolute top-20 right-4 z-20 hidden lg:block pointer-events-auto">
        <SplitViewportMonitor />
      </div>

      {/* 4. Bottom Dock: Swarm Console & Copilot Brain (Bottom Left & Bottom Right) */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto hidden xl:flex items-end gap-4">
        {/* Glowing Cyber Log Console */}
        <CyberLogConsole />

        {/* Cybernetic Copilot Brain & Waveform Terminal */}
        <CopilotInterface />
      </div>

      {/* 5. Mobile & Tablet Responsive Floating Drawer (When screen width < xl) */}
      <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-auto xl:hidden flex flex-col items-center">
        {isPanelVisible ? (
          <div className="w-full max-w-lg flex flex-col items-center">
            {/* Tab switch header */}
            <div className="flex items-center gap-1 p-1 rounded-t-xl bg-slate-900/90 border border-cyan-500/30 text-xs font-mono">
              <button
                onClick={() => setActiveTab('CONSOLE')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 ${
                  activeTab === 'CONSOLE' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Logs</span>
              </button>
              <button
                onClick={() => setActiveTab('COPILOT')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 ${
                  activeTab === 'COPILOT' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Copilot</span>
              </button>
              <button
                onClick={() => setActiveTab('SPLIT_VIEW')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 ${
                  activeTab === 'SPLIT_VIEW' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera PiP</span>
              </button>
              <button
                onClick={() => setIsPanelVisible(false)}
                className="p-1 text-slate-400 hover:text-slate-200 ml-2"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full">
              {activeTab === 'CONSOLE' && <CyberLogConsole />}
              {activeTab === 'COPILOT' && <CopilotInterface />}
              {activeTab === 'SPLIT_VIEW' && <SplitViewportMonitor />}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsPanelVisible(true)}
            className="px-4 py-2 rounded-full bg-slate-900/90 border border-cyan-500/50 text-cyan-300 font-mono text-xs flex items-center gap-2 shadow-lg"
          >
            <ChevronUp className="w-4 h-4" />
            <span>Open Swarm Console & Copilot</span>
          </button>
        )}
      </div>

      {/* 6. Bottom Center: Real-Time Drone Action Ticker */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#080d1a]/85 border border-cyan-500/30 backdrop-blur-md shadow-xl text-xs font-mono text-slate-300 pointer-events-none">
        <Radio className="w-3.5 h-3.5 text-cyan-400 animate-ping" />
        <span className="text-cyan-400 font-bold">{bot.name}:</span>
        <span className="text-slate-300">{bot.activeStepLabel}</span>
        {bot.phase !== 'SLEEP_BENCH' && (
          <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700">
            <div 
              className="bg-cyan-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${bot.phaseProgress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

