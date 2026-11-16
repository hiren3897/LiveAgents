import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  Terminal, 
  MessageSquare, 
  Activity, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useLabStore } from '../store/labStore';
import { AgentLogMessage } from '../types';

export const CopilotSidebar: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'COPILOT' | 'COMMS'>('COPILOT');

  const tvs = useLabStore(state => state.tvs);
  const bot = useLabStore(state => state.bot);
  const logs = useLabStore(state => state.logs);
  const voiceEnabled = useLabStore(state => state.voiceEnabled);
  const setVoiceEnabled = useLabStore(state => state.setVoiceEnabled);
  const isCopilotSpeaking = useLabStore(state => state.isCopilotSpeaking);
  const activeCopilotSpeech = useLabStore(state => state.activeCopilotSpeech);
  const setCopilotSpeaking = useLabStore(state => state.setCopilotSpeaking);
  const addLogMessage = useLabStore(state => state.addLogMessage);
  const fixAllTvs = useLabStore(state => state.fixAllTvs);
  const triggerManualFailure = useLabStore(state => state.triggerManualFailure);

  // Native Web Speech Synthesis with graceful fallback
  const speak = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.08;
    utterance.pitch = 1.15; // cute slightly higher-pitched creature voice

    // Look for friendly English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Google') || v.name.includes('Alex')));
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setCopilotSpeaking(true, text);
    utterance.onend = () => setCopilotSpeaking(false);
    utterance.onerror = () => setCopilotSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const processQuery = async (query: string) => {
    const q = query.trim().toLowerCase();
    const allTvs = Object.values(tvs);
    const brokenTvs = allTvs.filter(t => t.status === 'BROKEN');
    const repairingTvs = allTvs.filter(t => t.status === 'REPAIRING');

    let reply = '';

    if (q.includes('status') || q.includes('how many') || q.includes('health') || q.includes('overview')) {
      const healthyCount = allTvs.filter(t => t.status === 'HEALTHY').length;
      reply = `Quack! Lab report: Out of 70 monitored displays, ${healthyCount} are healthy, ${brokenTvs.length} broken, and ${repairingTvs.length} being repaired. Battery is at ${bot.battery}%.`;
    } else if (q.includes('which tv') || q.includes('fixing') || q.includes('doing') || q.includes('drone') || q.includes('bot')) {
      if (bot.phase === 'SLEEPING') {
        reply = `I am currently resting and charging at my maintenance desk [Standby: 100%]. All lab displays are running clean!`;
      } else {
        reply = `Right now I am working on ${bot.currentTvId || 'a display'} at ${bot.targetStandId || 'stand'}. Current step: ${bot.activeStepLabel}.`;
      }
    } else if (q.includes('row 2') || q.includes('row 1') || q.includes('row 3') || q.includes('row 4')) {
      let targetRow = 1;
      if (q.includes('row 1')) targetRow = 0;
      if (q.includes('row 2')) targetRow = 1;
      if (q.includes('row 3')) targetRow = 2;
      if (q.includes('row 4')) targetRow = 3;

      const rowTvs = allTvs.filter(t => t.row === targetRow);
      const rowBroken = rowTvs.filter(t => t.status === 'BROKEN' || t.status === 'REPAIRING');
      if (rowBroken.length === 0) {
        reply = `Row ${targetRow + 1} is completely nominal! All ${rowTvs.length} displays are streaming stable 60 FPS video.`;
      } else {
        reply = `Row ${targetRow + 1} has ${rowBroken.length} display issue: ${rowBroken.map(t => `${t.id} (${t.error})`).join(', ')}.`;
      }
    } else if (q.includes('fix all') || q.includes('restore') || q.includes('reset')) {
      fixAllTvs();
      reply = `Global override triggered! All 70 TV panels have been restored to healthy. I'm waddling back to my desk to recharge!`;
    } else if (q.includes('break') || q.includes('fail') || q.includes('fault') || q.includes('test')) {
      triggerManualFailure();
      reply = `Triggered a random fault injection on the hardware bus. Watchdog has emitted a new diagnostic ticket!`;
    } else {
      reply = `BytePaws-MK1 copy! Monitoring 70 TV screens across 12 stands. Video sync rate at 99.8%. Let me know if you want me to inspect any stand!`;
    }

    setCopilotSpeaking(true, reply);
    speak(reply);

    addLogMessage({
      sender: 'CREATURE_BOT',
      recipient: 'LAB_SUPERVISOR',
      type: 'BOT_ACK',
      message: `[Voice Copilot Response] "${reply}"`
    });
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isProcessing) return;

    const query = inputText.trim();
    setInputText('');
    setIsProcessing(true);

    try {
      await processQuery(query);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <aside className="w-[380px] h-full flex flex-col bg-slate-950/95 border-l border-sky-500/30 backdrop-blur-xl shadow-2xl font-mono select-none pointer-events-auto">
      {/* Top Header & Avatar Hero */}
      <div className="p-3.5 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-b border-sky-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Reactive SVG Avatar Face Synced with 3D Bot Mood */}
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#e07a5f] to-[#f4a261] p-0.5 shadow-[0_0_20px_rgba(224,122,95,0.4)] flex items-center justify-center">
              <svg viewBox="0 0 40 40" className="w-10 h-10">
                {/* Visor */}
                <rect x="6" y="10" width="28" height="18" rx="8" fill="#090d16" />
                {/* Mood Eyes */}
                {bot.mood === 'SLEEPING' && (
                  <>
                    <line x1="11" y1="19" x2="17" y2="19" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="23" y1="19" x2="29" y2="19" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                  </>
                )}
                {bot.mood === 'WALKING' && (
                  <>
                    <circle cx="14" cy="19" r="3.2" fill="#38bdf8" />
                    <circle cx="26" cy="19" r="3.2" fill="#38bdf8" />
                  </>
                )}
                {bot.mood === 'REPAIRING' && (
                  <>
                    {/* Determined squint (> <) */}
                    <path d="M12 16 L16 19 L12 22" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    <path d="M28 16 L24 19 L28 22" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  </>
                )}
                {bot.mood === 'HAPPY' && (
                  <>
                    <path d="M11 20 Q14 16 17 20" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    <path d="M23 20 Q26 16 29 20" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  </>
                )}
                {/* Antenna */}
                <line x1="20" y1="10" x2="20" y2="4" stroke="#374151" strokeWidth="2" />
                <circle cx="20" cy="3" r="2.5" fill="#00f3ff" className="animate-pulse" />
              </svg>

              {/* Status Ring Ping */}
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-100 tracking-wider">BYTEPAWS-MK1</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-500/30">
                  {bot.mood}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">Micro-Creature Test Copilot</div>
            </div>
          </div>

          {/* Voice Toggle Button */}
          <button
            onClick={() => {
              if (isCopilotSpeaking) window.speechSynthesis.cancel();
              setVoiceEnabled(!voiceEnabled);
            }}
            className={`p-2 rounded-lg border transition-all ${
              voiceEnabled 
                ? 'bg-sky-950/60 border-sky-500/50 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]' 
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={voiceEnabled ? 'Voice output enabled' : 'Voice output muted'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Live Audio Speech Transcript / Speech Waveform */}
        <div className="mt-3 p-2.5 rounded-xl bg-black/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
            <span className="flex items-center gap-1 text-sky-400">
              <Sparkles className="w-3 h-3" />
              <span>COGNITIVE DIALOGUE</span>
            </span>
            <span className="text-[9px] text-emerald-400 font-bold">
              {isCopilotSpeaking ? 'SPEAKING' : 'IDLE'}
            </span>
          </div>

          {/* Dynamic Audio Equalizer Bars */}
          <div className="flex items-end gap-1 h-5 mb-2">
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm transition-all duration-100 ${
                  isCopilotSpeaking 
                    ? 'bg-gradient-to-t from-sky-500 to-cyan-300' 
                    : 'bg-slate-800'
                }`}
                style={{
                  height: isCopilotSpeaking 
                    ? `${25 + Math.abs(Math.sin(Date.now() / 120 + i)) * 75}%` 
                    : '20%'
                }}
              />
            ))}
          </div>

          <div className="text-[11px] text-sky-200 leading-relaxed italic line-clamp-3">
            "{activeCopilotSpeech}"
          </div>
        </div>
      </div>

      {/* Tabs: Copilot Chat vs Swarm Comms Log */}
      <div className="flex border-b border-slate-800 bg-slate-950 text-xs">
        <button
          onClick={() => setActiveTab('COPILOT')}
          className={`flex-1 py-2 font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'COPILOT' 
              ? 'text-sky-400 border-b-2 border-sky-400 bg-sky-950/20' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Operator Chat</span>
        </button>
        <button
          onClick={() => setActiveTab('COMMS')}
          className={`flex-1 py-2 font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'COMMS' 
              ? 'text-sky-400 border-b-2 border-sky-400 bg-sky-950/20' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Swarm Bus ({logs.length})</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'COPILOT' ? (
          <div className="flex flex-col h-full justify-between">
            {/* Quick Prompt Chips */}
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-bold">
                Suggested Prompts:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'What is the lab status?',
                  'Which TV are you fixing right now?',
                  'What happened on Row 2?',
                  'Fix all broken TVs',
                  'Trigger a test failure'
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => processQuery(chip)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-sky-500/50 hover:bg-sky-950/30 text-slate-300 hover:text-sky-200 text-[10px] transition-all text-left"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Live Bot Diagnostics Card */}
              <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Current Phase:</span>
                  <span className="text-sky-300 font-bold">{bot.phase}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Target Screen:</span>
                  <span className="text-amber-400 font-bold">{bot.currentTvId || 'None (Dormant)'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Aisle Pathfinding:</span>
                  <span className="text-emerald-400 font-bold">Manhattan 2-Step (No-Clip)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Battery Reserve:</span>
                  <span className="text-emerald-400 font-bold">{bot.battery}%</span>
                </div>
              </div>
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask Creature Bot or give command..."
                className="flex-1 bg-black/60 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 font-sans"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isProcessing}
                className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1 shadow-[0_0_10px_rgba(56,189,248,0.3)]"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          /* Live Agent-to-Agent Comms Feed */
          <div className="space-y-2">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div 
                  key={log.id} 
                  className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-sky-500/40 transition-all text-xs"
                >
                  <div 
                    className="flex items-center justify-between cursor-pointer select-none"
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  >
                    <div className="flex items-center gap-1.5 text-[10px]">
                      {isExpanded ? <ChevronDown className="w-3 h-3 text-sky-400" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
                      <span className="text-slate-500">{log.timestamp}</span>
                      <span className="font-bold text-sky-400">{log.sender}</span>
                      <span className="text-slate-600">➔</span>
                      <span className="text-slate-300">{log.recipient}</span>
                    </div>

                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      log.type === 'TICKET_DISPATCH' ? 'bg-rose-950 text-rose-300 border border-rose-500/40' :
                      log.type === 'IR_BURST' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                      log.type === 'VERIFY_OK' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                      'bg-sky-950 text-sky-300 border border-sky-500/40'
                    }`}>
                      {log.type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-1 pl-4 text-slate-200 text-[11px] leading-relaxed">
                    {log.message}
                  </div>

                  {/* Expandable JSON Ticket payload */}
                  {isExpanded && log.rawJson && (
                    <div className="mt-2 pl-4 pt-2 border-t border-slate-800">
                      <div className="text-[10px] text-sky-400 font-bold mb-1">
                        STRUCTURED TICKET PAYLOAD (JSON):
                      </div>
                      <pre className="p-2 rounded bg-black/80 border border-slate-800 text-[10px] text-emerald-400 overflow-x-auto leading-tight">
{JSON.stringify(log.rawJson, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
