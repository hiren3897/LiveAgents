import { useLabStore } from '../store/useLabStore';

export class CopilotBrainService {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  private static activeUtterance: SpeechSynthesisUtterance | null = null;

  public static buildSystemPromptContext(): string {
    const state = useLabStore.getState();
    const { tvs, stands, bot, hardwareConfig, dimensions, logs } = state;

    const allTvs = Object.values(tvs);
    const healthyTvs = allTvs.filter(t => t.status === 'healthy');
    const failingTvs = allTvs.filter(t => t.status === 'failing');
    const repairingTvs = allTvs.filter(t => t.status === 'repairing');

    const failingSummary = failingTvs.map(t => 
      `- ${t.id} (Stand: ${t.standId}, Level: ${t.level}, Side: ${t.side}): Fault=${t.errorType}, Latency=${t.latencyMs}ms, Signal=${t.signalStrength}%`
    ).join('\n') || 'None (All systems nominal)';

    const recentLogs = logs.slice(0, 4).map(l => 
      `[${l.timestamp}] ${l.sender} -> ${l.recipient} [${l.severity}]: ${l.message}`
    ).join('\n');

    return `
### SYSTEM ROLE & OPERATIONAL DIRECTIVE
You are AETHER-7, the Autonomous Cybernetic AI Copilot of the 70-Display Hardware Automation Lab.
Your primary role is real-time matrix telemetry evaluation, automated drone dispatch orchestration, and human operator co-piloting.

### LIVE LAB CONTEXT MATRIX
- Lab Configuration: ${dimensions.rows} Rows x ${dimensions.cols} Columns (${Object.keys(stands).length} floor stands).
- Total Monitored TV Panels: ${allTvs.length}
- Status Breakdown:
  * Healthy: ${healthyTvs.length}
  * Failing: ${failingTvs.length}
  * Active Bot Interventions: ${repairingTvs.length}
- Maintenance Drone (${bot.name}):
  * Current State: ${bot.phase}
  * Active Step: ${bot.activeStepLabel}
  * Target TV: ${bot.currentTvId || 'None'}
  * Battery: ${bot.batteryLevel}%
- Hardware Bus Simulation:
  * Simulated Packet Drop Rate: ${(hardwareConfig.packetDropRate * 100).toFixed(1)}%
  * Signal Propagation Delay: ${hardwareConfig.propagationDelayMs}ms
  * Anomaly Loop: ${hardwareConfig.isSimulationRunning ? 'ACTIVE' : 'PAUSED'}

### ACTIVE FAILING DISPLAYS:
${failingSummary}

### RECENT AGENT LOG INTERCHANGES:
${recentLogs}
`;
  }

  public static speak(text: string) {
    if (!this.synth) return;

    // Cancel current speech if ongoing
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try finding an English or cybernetic sounding voice
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google UK English Male') || 
      v.name.includes('Daniel') || 
      v.name.includes('Alex') ||
      v.name.includes('Samantha') ||
      (v.lang.startsWith('en') && !v.localService)
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      useLabStore.getState().setCopilotSpeaking(true, text);
    };

    utterance.onend = () => {
      useLabStore.getState().setCopilotSpeaking(false);
    };

    utterance.onerror = () => {
      useLabStore.getState().setCopilotSpeaking(false);
    };

    this.activeUtterance = utterance;
    this.synth.speak(utterance);
  }

  public static stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      useLabStore.getState().setCopilotSpeaking(false);
    }
  }

  public static async processOperatorQuery(userQuery: string): Promise<string> {
    const q = userQuery.toLowerCase().trim();
    const state = useLabStore.getState();
    const { tvs, bot, hardwareConfig, dimensions } = state;
    const failing = Object.values(tvs).filter(t => t.status === 'failing');
    const repairing = Object.values(tvs).filter(t => t.status === 'repairing');

    let reply = '';

    if (q.includes('which tv') || q.includes('broken') || q.includes('failing') || q.includes('error')) {
      if (failing.length === 0 && repairing.length === 0) {
        reply = `All ${Object.keys(tvs).length} TV panels across the ${dimensions.rows}x${dimensions.cols} matrix are currently healthy and responding with sub-20ms latencies. No active faults detected.`;
      } else {
        const list = [...failing, ...repairing].map(t => `${t.id} on ${t.standId} (${t.errorType?.replace(/_/g, ' ') || 'Unknown'})`).join(', ');
        reply = `Attention operator: There are currently ${failing.length + repairing.length} display(s) with anomalies: ${list}. The maintenance bot ${bot.name} is handling resolution.`;
      }
    } else if (q.includes('drone') || q.includes('bot') || q.includes('repair')) {
      if (bot.phase === 'SLEEP_BENCH') {
        reply = `Maintenance drone ${bot.name} is docked at the sleep bench on standby with battery at ${bot.batteryLevel}%. Telemetry is nominal.`;
      } else {
        reply = `Drone ${bot.name} is actively working on ${bot.currentTvId} at ${bot.targetStandId}. Phase: ${bot.phase}. ${bot.activeStepLabel}. Progress: ${bot.phaseProgress}%.`;
      }
    } else if (q.includes('break') || q.includes('fail') || q.includes('fault') || q.includes('anomaly') || q.includes('test')) {
      state.triggerManualAnomaly();
      reply = `Injecting controlled anomaly sequence into the hardware bus. Diagnostic test agent will flag the fault immediately.`;
    } else if (q.includes('packet') || q.includes('drop') || q.includes('delay') || q.includes('ir')) {
      reply = `Hardware simulation parameters: IR packet drop rate is currently calibrated at ${(hardwareConfig.packetDropRate * 100).toFixed(1)}%, with a propagation delay of ${hardwareConfig.propagationDelayMs} milliseconds over the physical carrier bus.`;
    } else if (q.includes('reset') || q.includes('fix all') || q.includes('restore')) {
      state.resetAllTvs();
      reply = `Emergency override executed. Global reset dispatched to all 70 TV displays. Video matrices synchronized.`;
    } else if (q.includes('scale') || q.includes('dimension') || q.includes('grid')) {
      reply = `Current lab topology is configured for ${dimensions.rows} rows by ${dimensions.cols} columns (${dimensions.rows * dimensions.cols} stands, holding up to ${dimensions.rows * dimensions.cols * 6} TVs). The spatial math dynamically recalculates aisle spacing without mesh collision.`;
    } else {
      reply = `Acknowledged operator. System status: ${Object.keys(tvs).length} displays monitored. Drone ${bot.name} is ${bot.phase}. Matrix telemetry integrity at ${( (Object.values(tvs).filter(t => t.status === 'healthy').length / Object.keys(tvs).length) * 100 ).toFixed(1)}%.`;
    }

    // Speak reply
    this.speak(reply);

    // Also log to cyber log console
    state.addLogMessage({
      sender: 'COPILOT_BRAIN',
      recipient: 'ALL',
      severity: 'LOW',
      error_signature: 'COPILOT_QUERY_DISPATCH',
      assigned_priority: 'P3',
      message: `[VOICE/TEXT] ${reply}`
    });

    return reply;
  }
}

