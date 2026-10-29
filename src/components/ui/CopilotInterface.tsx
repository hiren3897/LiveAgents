import React, { useState } from 'react';
import { useLabStore } from '../../store/useLabStore';
import { CopilotBrainService } from '../../copilot/CopilotBrain';
import { Mic, Send, Volume2, VolumeX, Sparkles, MessageSquare, Bot, AudioLines } from 'lucide-react';

export const CopilotInterface: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const copilotSpeaking = useLabStore(state => state.copilotSpeaking);
  const activeTranscript = useLabStore(state => state.activeCopilotTranscript);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isProcessing) return;

    const query = inputText.trim();
    setInputText('');
    setIsProcessing(true);

    try {
      await CopilotBrainService.processOperatorQuery(query);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputText(prompt);
    CopilotBrainService.processOperatorQuery(prompt);
  };

  return (
    <div className="w-[440px] rounded-xl border border-cyan-500/40 bg-[#080d1a]/95 backdrop-blur-md shadow-[0_0_30px_rgba(0,243,255,0.2)] overflow-hidden font-mono flex flex-col">
      {/* Top Header with Waveform Status */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-cyan-500/30">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="w-5 h-5 text-cyan-400" />
            {copilotSpeaking && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>AETHER-7 COPILOT BRAIN</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                ACTIVE
              </span>
            </div>
            <div className="text-[10px] text-slate-400">Context Compiler & Neural Voice Driver</div>
          </div>
        </div>

        {/* Audio Mute / Stop Button */}
        <button
          onClick={() => {
            if (copilotSpeaking) CopilotBrainService.stopSpeaking();
          }}
          className={`p-1.5 rounded transition-all ${
            copilotSpeaking 
              ? 'text-cyan-300 bg-cyan-950 border border-cyan-500/50 animate-pulse' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title={copilotSpeaking ? 'Stop speaking' : 'Audio driver active'}
        >
          {copilotSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Cybernetic AI Visual Terminal & Waveform Monitor */}
      <div className="p-3 bg-gradient-to-b from-[#0a1020] to-[#060a14] border-b border-slate-800">
        <div className="flex items-center gap-3">
          {/* Circular Cybernetic Avatar Core */}
          <div className="relative w-14 h-14 rounded-full border-2 border-cyan-500/60 bg-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.3)]">
            <div className={`w-10 h-10 rounded-full border border-cyan-400/80 bg-cyan-950/40 flex items-center justify-center transition-all ${
              copilotSpeaking ? 'scale-110 shadow-[0_0_15px_rgba(0,243,255,0.8)]' : ''
            }`}>
              <Sparkles className={`w-5 h-5 text-cyan-300 ${copilotSpeaking ? 'animate-spin' : ''}`} />
            </div>
            {/* Spinning Radar Ring */}
            <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
          </div>

          {/* Active Audio Waveform Equalizer (CSS Pulsing Bars) */}
          <div className="flex-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>SYNTHESIZER FREQ SPECTRUM</span>
              <span className="text-cyan-400 font-bold">{copilotSpeaking ? 'TRANSMITTING' : 'LISTENING'}</span>
            </div>

            {/* 24 Frequency Waveform Bars */}
            <div className="flex items-end gap-1 h-8 bg-black/60 p-1 rounded border border-slate-800">
              {Array.from({ length: 22 }).map((_, i) => {
                const baseHeight = copilotSpeaking 
                  ? `${20 + Math.abs(Math.sin((i + Date.now() / 150)) * 75)}%` 
                  : `${15 + (i % 3) * 8}%`;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm transition-all duration-75 ${
                      copilotSpeaking 
                        ? 'bg-gradient-to-t from-cyan-600 via-cyan-400 to-white' 
                        : 'bg-slate-700'
                    }`}
                    style={{ height: baseHeight }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Spoken Transcript Readout */}
        <div className="mt-2.5 p-2 rounded bg-black/70 border border-slate-800/80 text-[11px] text-cyan-200 leading-relaxed min-h-[44px] flex items-start gap-1.5">
          <AudioLines className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="italic">"{activeTranscript}"</div>
        </div>
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="px-3 py-2 bg-slate-950 flex flex-wrap gap-1.5 border-b border-slate-800 text-[10px]">
        {[
          'Which TVs are broken right now?',
          'What is the drone doing?',
          'Trigger an anomaly',
          'Reset all displays',
          'Show packet drop rate'
        ].map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickPrompt(prompt)}
            className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 hover:bg-cyan-950/40 transition-all truncate"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Interactive Operator Input Field */}
      <form onSubmit={handleSubmit} className="p-2.5 bg-slate-900/90 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask AETHER-7 copilot or type command..."
          className="flex-1 bg-black/60 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1 shadow-[0_0_10px_rgba(0,243,255,0.4)]"
        >
          <Send className="w-3 h-3" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
};

