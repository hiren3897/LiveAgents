import React, { useRef, useEffect, useState } from 'react';
import { useLabStore } from '../../store/useLabStore';
import { Camera, Maximize2, Minimize2, Video, Radio, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export const SplitViewportMonitor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedTvId = useLabStore(state => state.selectedTvId);
  const tvs = useLabStore(state => state.tvs);
  const bot = useLabStore(state => state.bot);
  const [feedMode, setFeedMode] = useState<'BOT_OPTICAL' | 'AISLE_ARRAY' | 'DIRECT_TMDS'>('BOT_OPTICAL');
  const [isExpanded, setIsExpanded] = useState(false);

  // Default to inspected TV or bot's current target
  const targetTv = selectedTvId ? tvs[selectedTvId] : (bot.currentTvId ? tvs[bot.currentTvId] : Object.values(tvs)[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frameCount = 0;

    const render = () => {
      frameCount++;
      const w = canvas.width;
      const h = canvas.height;

      // Fill background
      ctx.fillStyle = '#05070e';
      ctx.fillRect(0, 0, w, h);

      if (!targetTv) {
        ctx.fillStyle = '#64748b';
        ctx.font = '12px monospace';
        ctx.fillText('NO OPTICAL FEED DETECTED', w / 2 - 80, h / 2);
        return;
      }

      if (targetTv.status === 'healthy') {
        // Draw SMPTE Color Bars with subtle live motion
        const barWidth = w / 7;
        const colors = ['#ffffff', '#ffff00', '#00ffff', '#00ff00', '#ff00ff', '#ff0000', '#0000ff'];
        colors.forEach((col, idx) => {
          ctx.fillStyle = col;
          ctx.fillRect(idx * barWidth, 0, barWidth, h * 0.75);
        });

        // Bottom test sync bars
        ctx.fillStyle = '#0a0f1d';
        ctx.fillRect(0, h * 0.75, w, h * 0.25);

        // Moving sync pulse bar
        const pulseX = (frameCount * 3) % w;
        ctx.fillStyle = '#00ff66';
        ctx.fillRect(pulseX, h * 0.75, 40, h * 0.25);

        // Text overlay
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`1080p60 RGB | SYNC LOCKED | CRC: 0x9F4A`, 12, h * 0.88);

      } else if (targetTv.status === 'failing') {
        // Render noisy static snow and Glitch visual bars
        const imgData = ctx.createImageData(w, h);
        const buffer = new Uint32Array(imgData.data.buffer);
        const len = buffer.length;

        for (let i = 0; i < len; i++) {
          const noise = Math.random() * 255;
          // Red-shifted noisy snow
          buffer[i] = (255 << 24) | (Math.floor(noise * 0.2) << 16) | (Math.floor(noise * 0.2) << 8) | Math.floor(noise * 0.9);
        }
        ctx.putImageData(imgData, 0, 0);

        // Horizontal scan glitch tear
        if (Math.random() > 0.4) {
          const tearY = Math.random() * h;
          const tearH = 8 + Math.random() * 28;
          ctx.fillStyle = 'rgba(255, 0, 80, 0.6)';
          ctx.fillRect(0, tearY, w, tearH);
        }

        // Error Banner in center
        ctx.fillStyle = 'rgba(20, 0, 0, 0.85)';
        ctx.fillRect(w * 0.1, h * 0.35, w * 0.8, h * 0.3);
        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(w * 0.1, h * 0.35, w * 0.8, h * 0.3);

        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`NO TMDS SYNC: ${targetTv.errorType || 'SIGNAL LOSS'}`, w * 0.15, h * 0.48);
        ctx.font = '10px monospace';
        ctx.fillStyle = '#fda4af';
        ctx.fillText(`LOSS OF CARRIER CLOCK | PACKETS DROPPED`, w * 0.15, h * 0.58);

      } else if (targetTv.status === 'repairing') {
        // Active intervention: test pattern sweep + IR burst bars
        ctx.fillStyle = '#080d1a';
        ctx.fillRect(0, 0, w, h);

        // Scanning grid lines
        ctx.strokeStyle = '#ff990033';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 20) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += 20) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Moving radar sweep line
        const sweepY = (frameCount * 4) % h;
        ctx.fillStyle = 'rgba(255, 153, 0, 0.25)';
        ctx.fillRect(0, sweepY, w, 6);

        // Flashing IR packet bars
        ctx.fillStyle = '#ff9900';
        ctx.fillRect(15, h - 25, (w - 30) * (bot.phaseProgress / 100), 10);

        ctx.font = 'bold 11px monospace';
        ctx.fillText(`REPAIR SEQUENCE: ${bot.phase} (${bot.phaseProgress}%)`, 15, h - 35);
      }

      // Draw Optical HUD Crosshairs
      ctx.strokeStyle = '#00f3ff55';
      ctx.lineWidth = 1;
      const cx = w / 2;
      const cy = h / 2;
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy); ctx.lineTo(cx + 24, cy);
      ctx.moveTo(cx, cy - 24); ctx.lineTo(cx, cy + 24);
      ctx.stroke();

      // Corner Reticles
      const bracketSize = 14;
      ctx.strokeStyle = '#00f3ff88';
      // Top Left
      ctx.beginPath(); ctx.moveTo(12, 12 + bracketSize); ctx.lineTo(12, 12); ctx.lineTo(12 + bracketSize, 12); ctx.stroke();
      // Top Right
      ctx.beginPath(); ctx.moveTo(w - 12 - bracketSize, 12); ctx.lineTo(w - 12, 12); ctx.lineTo(w - 12, 12 + bracketSize); ctx.stroke();
      // Bottom Left
      ctx.beginPath(); ctx.moveTo(12, h - 12 - bracketSize); ctx.lineTo(12, h - 12); ctx.lineTo(12 + bracketSize, h - 12); ctx.stroke();
      // Bottom Right
      ctx.beginPath(); ctx.moveTo(w - 12 - bracketSize, h - 12); ctx.lineTo(w - 12, h - 12); ctx.lineTo(w - 12, h - 12 - bracketSize); ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [targetTv, bot.phase, bot.phaseProgress]);

  return (
    <div className={`transition-all duration-300 rounded-xl border border-cyan-500/40 bg-[#080d1a]/95 backdrop-blur-md shadow-[0_0_25px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col ${
      isExpanded ? 'w-[420px] h-[340px]' : 'w-[320px] h-[260px]'
    }`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-cyan-500/30 text-xs font-mono">
        <div className="flex items-center gap-2 text-cyan-400">
          <Camera className="w-3.5 h-3.5 animate-pulse" />
          <span className="font-semibold tracking-wider">OPTICAL PiP MONITOR</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
            {targetTv?.id || 'IDLE'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="hover:text-cyan-300 transition-colors p-1"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Canvas Viewport Frame */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={260} 
          className="w-full h-full object-cover"
        />

        {/* Live Status Overlay Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/75 border border-slate-700 text-[10px] font-mono text-slate-300">
          <Radio className="w-3 h-3 text-red-500 animate-ping" />
          <span>REC</span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400 font-bold">59.94 FPS</span>
        </div>

        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/75 border border-slate-700 text-[10px] font-mono text-cyan-300">
          FOV: 78° | ZOOM: 2.4X
        </div>

        {/* Target TV Details Pill */}
        {targetTv && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2.5 py-1 rounded bg-black/85 border border-slate-700/80 text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              {targetTv.status === 'healthy' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {targetTv.status === 'failing' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-bounce" />}
              {targetTv.status === 'repairing' && <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
              <span className="text-slate-200 font-bold">{targetTv.id}</span>
              <span className="text-slate-400">({targetTv.standId} · L{targetTv.level})</span>
            </div>
            <div className="text-slate-400">
              TEMP: <span className="text-cyan-300">{targetTv.temperatureC}°C</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls: Switch camera source */}
      <div className="flex items-center justify-around px-2 py-1.5 bg-slate-950 border-t border-slate-800 text-[10px] font-mono text-slate-400">
        <button
          onClick={() => setFeedMode('BOT_OPTICAL')}
          className={`px-2 py-0.5 rounded transition-all ${
            feedMode === 'BOT_OPTICAL' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50' : 'hover:text-slate-200'
          }`}
        >
          Drone Optical
        </button>
        <button
          onClick={() => setFeedMode('AISLE_ARRAY')}
          className={`px-2 py-0.5 rounded transition-all ${
            feedMode === 'AISLE_ARRAY' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50' : 'hover:text-slate-200'
          }`}
        >
          Aisle Cam #2
        </button>
        <button
          onClick={() => setFeedMode('DIRECT_TMDS')}
          className={`px-2 py-0.5 rounded transition-all ${
            feedMode === 'DIRECT_TMDS' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50' : 'hover:text-slate-200'
          }`}
        >
          Direct TMDS Bus
        </button>
      </div>
    </div>
  );
};

