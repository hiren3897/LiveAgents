import React, { useRef, useEffect, useState } from 'react';
import { Camera, Radio, Maximize2, Minimize2, Video, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useLabStore } from '../store/labStore';

export const PipCameraFeed: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedTvId = useLabStore(state => state.selectedTvId);
  const tvs = useLabStore(state => state.tvs);
  const botPhase = useLabStore(state => state.bot.phase);
  const bot = useLabStore(state => state.bot);

  const targetTv = selectedTvId ? tvs[selectedTvId] : (bot.currentTvId ? tvs[bot.currentTvId] : Object.values(tvs)[0]);
  const activeCameraId = targetTv ? `CAM-R${targetTv.row + 1}-${targetTv.col < 2 ? 'WEST' : 'EAST'}` : 'CAM-R1-WEST';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const render = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      // Dark CRT base
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, w, h);

      if (!targetTv) {
        ctx.fillStyle = '#64748b';
        ctx.font = '11px monospace';
        ctx.fillText('NO OPTICAL FEED CONNECTED', 30, h / 2);
        return;
      }

      if (targetTv.status === 'HEALTHY') {
        // High-definition test pattern with moving sync bar
        const barWidth = w / 7;
        const colors = ['#ffffff', '#ffff00', '#00ffff', '#00ff00', '#ff00ff', '#ff0000', '#0000ff'];
        colors.forEach((col, idx) => {
          ctx.fillStyle = col;
          ctx.fillRect(idx * barWidth, 0, barWidth, h * 0.72);
        });

        // Bottom raster monitor
        ctx.fillStyle = '#0b1120';
        ctx.fillRect(0, h * 0.72, w, h * 0.28);

        // Moving green sync pulse
        const pulseX = (frame * 3.5) % w;
        ctx.fillStyle = '#10b981';
        ctx.fillRect(pulseX, h * 0.72, 45, h * 0.28);

        // Text telemetry
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`1080p60 RGB · TMDS LOCKED · ${targetTv.id}`, 10, h * 0.88);

      } else if (targetTv.status === 'BROKEN') {
        // Noisy snow static
        const imgData = ctx.createImageData(w, h);
        const buffer = new Uint32Array(imgData.data.buffer);
        const len = buffer.length;

        for (let i = 0; i < len; i++) {
          const noise = Math.random() * 255;
          // Red-shifted noisy snow
          buffer[i] = (255 << 24) | (Math.floor(noise * 0.25) << 16) | (Math.floor(noise * 0.25) << 8) | Math.floor(noise * 0.95);
        }
        ctx.putImageData(imgData, 0, 0);

        // Random horizontal scanline glitch tear
        if (Math.random() > 0.4) {
          const tearY = Math.random() * h;
          const tearH = 8 + Math.random() * 24;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
          ctx.fillRect(0, tearY, w, tearH);
        }

        // Center error alert banner
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(w * 0.08, h * 0.32, w * 0.84, h * 0.36);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(w * 0.08, h * 0.32, w * 0.84, h * 0.36);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`SIGNAL SYNC LOST: ${targetTv.error || 'TMDS CLK'}`, w * 0.12, h * 0.48);
        ctx.fillStyle = '#fca5a5';
        ctx.font = '9px monospace';
        ctx.fillText(`CODE: ${targetTv.errorCode || '0x82'} | CARRIER TIMEOUT`, w * 0.12, h * 0.60);

      } else if (targetTv.status === 'REPAIRING') {
        // Amber calibration radar sweep & IR burst pulses
        ctx.fillStyle = '#080d1a';
        ctx.fillRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 18) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += 18) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // Radar line sweep
        const sweepY = (frame * 4) % h;
        ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.fillRect(0, sweepY, w, 6);

        // Flashing progress bar
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(12, h - 22, (w - 24) * (bot.phaseProgress / 100), 8);

        ctx.fillStyle = '#fef3c7';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`IR FLASH IN PROGRESS: ${Math.round(bot.phaseProgress)}%`, 12, h - 30);
      }

      // Optical reticle crosshair
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1;
      const cx = w / 2;
      const cy = h / 2;
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy); ctx.lineTo(cx + 18, cy);
      ctx.moveTo(cx, cy - 18); ctx.lineTo(cx, cy + 18);
      ctx.stroke();

      // Bracket corners
      const bSize = 10;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.beginPath(); ctx.moveTo(10, 10 + bSize); ctx.lineTo(10, 10); ctx.lineTo(10 + bSize, 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w - 10 - bSize, 10); ctx.lineTo(w - 10, 10); ctx.lineTo(w - 10, 10 + bSize); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, h - 10 - bSize); ctx.lineTo(10, h - 10); ctx.lineTo(10 + bSize, h - 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w - 10 - bSize, h - 10); ctx.lineTo(w - 10, h - 10); ctx.lineTo(w - 10, h - 10 - bSize); ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [targetTv, bot.phaseProgress]);

  return (
    <div className={`transition-all duration-300 rounded-xl border border-sky-500/40 bg-slate-950/90 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col font-mono pointer-events-auto ${
      isExpanded ? 'w-[360px] h-[280px]' : 'w-[280px] h-[220px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-sky-500/30 text-xs">
        <div className="flex items-center gap-2 text-sky-400">
          <Camera className="w-3.5 h-3.5 animate-pulse" />
          <span className="font-bold tracking-wider">AISLE OPTICAL PiP</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-500/30">
            {activeCameraId}
          </span>
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="hover:text-sky-300 transition-colors p-0.5"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Viewport Canvas */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        <canvas 
          ref={canvasRef} 
          width={360} 
          height={220} 
          className="w-full h-full object-cover"
        />

        {/* Live Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/75 border border-slate-700 text-[9px] text-slate-300">
          <Radio className="w-2.5 h-2.5 text-rose-500 animate-ping" />
          <span className="font-bold text-rose-400">LIVE</span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400">60 FPS</span>
        </div>

        {/* Monitored TV Badge */}
        {targetTv && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2.5 py-1 rounded bg-black/85 border border-slate-700/80 text-[10px]">
            <div className="flex items-center gap-1.5">
              {targetTv.status === 'HEALTHY' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              {targetTv.status === 'BROKEN' && <AlertTriangle className="w-3 h-3 text-rose-400 animate-bounce" />}
              {targetTv.status === 'REPAIRING' && <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />}
              <span className="text-slate-100 font-bold">{targetTv.id}</span>
              <span className="text-slate-400">({targetTv.standId} · Slot {targetTv.slot + 1})</span>
            </div>
            <div className="text-slate-400 text-[9px]">
              TEMP: <span className="text-sky-300 font-bold">{targetTv.temperatureC}°C</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
