import React, { useState } from 'react';
import { useLabStore } from '../../store/useLabStore';
import { AgentStructuredMessage } from '../../types';
import { Terminal, ShieldAlert, Cpu, Activity, ChevronRight, ChevronDown, Trash2, Filter } from 'lucide-react';

export const CyberLogConsole: React.FC = () => {
  const logs = useLabStore(state => state.logs);
  const clearLogs = useLabStore(state => state.clearLogs);
  const [filterAgent, setFilterAgent] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = filterAgent === 'ALL' 
    ? logs 
    : logs.filter(l => l.sender === filterAgent || l.recipient === filterAgent);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const getSeverityBadge = (severity: AgentStructuredMessage['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-950 text-rose-300 border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.4)]';
      case 'HIGH':
        return 'bg-orange-950 text-orange-300 border-orange-500/60';
      case 'MEDIUM':
        return 'bg-amber-950 text-amber-300 border-amber-500/60';
      case 'LOW':
      default:
        return 'bg-cyan-950 text-cyan-300 border-cyan-500/50';
    }
  };

  const getPriorityColor = (p: AgentStructuredMessage['assigned_priority']) => {
    switch (p) {
      case 'P0': return 'text-rose-400 font-extrabold';
      case 'P1': return 'text-orange-400 font-bold';
      case 'P2': return 'text-amber-400 font-semibold';
      case 'P3': return 'text-cyan-400';
    }
  };

  return (
    <div className="w-[440px] h-[360px] flex flex-col rounded-xl border border-cyan-500/40 bg-[#080d1a]/95 backdrop-blur-md shadow-[0_0_30px_rgba(0,243,255,0.15)] overflow-hidden font-mono">
      {/* Console Top Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-cyan-500/30">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-100 tracking-wider">SWARM COMM BUS</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
            {logs.length} EVTS
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={clearLogs}
            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear Log History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-950/80 border-b border-slate-800 text-[10px]">
        <Filter className="w-3 h-3 text-slate-400 ml-1" />
        {['ALL', 'TEST_AGENT', 'REPAIR_AGENT', 'BACKEND_ORCHESTRATOR', 'COPILOT_BRAIN'].map((role) => (
          <button
            key={role}
            onClick={() => setFilterAgent(role)}
            className={`px-1.5 py-0.5 rounded transition-all truncate ${
              filterAgent === role 
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {role.replace('_AGENT', '').replace('BACKEND_', '').replace('_BRAIN', '')}
          </button>
        ))}
      </div>

      {/* Scrollable Structured Message Feed */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 select-text text-xs scrollbar-thin scrollbar-thumb-slate-700">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            No agent messages on bus...
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div
                key={log.id}
                className="group p-2 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all text-[11px]"
              >
                {/* Header: Sender -> Recipient | Badges */}
                <div 
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => toggleExpand(log.id)}
                >
                  <div className="flex items-center gap-1.5">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                    )}
                    <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                    <span className="text-cyan-400 font-bold">{log.sender}</span>
                    <span className="text-slate-600">➔</span>
                    <span className="text-slate-300">{log.recipient}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] px-1.5 py-0.2 rounded border uppercase font-bold ${getSeverityBadge(log.severity)}`}>
                      {log.severity}
                    </span>
                    <span className={`text-[10px] ${getPriorityColor(log.assigned_priority)}`}>
                      {log.assigned_priority}
                    </span>
                  </div>
                </div>

                {/* Error Signature & Summary Message */}
                <div className="mt-1 pl-5">
                  <div className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                    <span className="text-slate-600">SIG:</span> {log.error_signature}
                    {log.tvId && (
                      <span className="ml-2 px-1 rounded bg-slate-800 text-slate-300">
                        {log.tvId}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-200 mt-0.5 leading-relaxed">
                    {log.message}
                  </div>
                </div>

                {/* Collapsible Structured JSON Viewer */}
                {isExpanded && (
                  <div className="mt-2 pl-5 pt-2 border-t border-slate-800">
                    <div className="text-[10px] text-cyan-400 font-semibold mb-1">
                      STRUCTURED SWARM PACKET (JSON):
                    </div>
                    <pre className="p-2 rounded bg-black/80 border border-slate-800 text-[10px] text-emerald-400 overflow-x-auto leading-tight font-mono">
{JSON.stringify({
  timestamp: log.timestamp,
  sender: log.sender,
  recipient: log.recipient,
  severity: log.severity,
  error_signature: log.error_signature,
  assigned_priority: log.assigned_priority,
  target_hardware: {
    tvId: log.tvId || null,
    standId: log.standId || null,
  },
  payload: log.metadata || {},
  message: log.message
}, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

