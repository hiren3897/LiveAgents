import { create } from 'zustand';
import { 
  TVState, 
  StandState, 
  MaintenanceBot, 
  AgentStructuredMessage, 
  LabDimensions, 
  HardwareSimConfig,
  CameraSensor,
  TVErrorType
} from '../types';

interface LabStoreState {
  dimensions: LabDimensions;
  tvs: Record<string, TVState>;
  stands: Record<string, StandState>;
  cameras: CameraSensor[];
  bot: MaintenanceBot;
  logs: AgentStructuredMessage[];
  hardwareConfig: HardwareSimConfig;
  selectedTvId: string | null;
  cameraFocusTarget: [number, number, number] | null;
  cameraMode: 'ORBIT_ROOM' | 'FOLLOW_BOT' | 'INSPECT_TV';
  copilotSpeaking: boolean;
  activeCopilotTranscript: string;

  // Actions
  updateDimensions: (rows: number, cols: number, spacingX?: number, spacingZ?: number) => void;
  setTVStatus: (id: string, status: TVState['status'], errorType?: TVErrorType) => void;
  updateTV: (id: string, partial: Partial<TVState>) => void;
  updateBot: (partial: Partial<MaintenanceBot>) => void;
  addLogMessage: (msg: Omit<AgentStructuredMessage, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  setSelectedTvId: (id: string | null) => void;
  setCameraMode: (mode: 'ORBIT_ROOM' | 'FOLLOW_BOT' | 'INSPECT_TV', target?: [number, number, number]) => void;
  setHardwareConfig: (partial: Partial<HardwareSimConfig>) => void;
  triggerManualAnomaly: (tvId?: string) => void;
  setCopilotSpeaking: (speaking: boolean, transcript?: string) => void;
  resetAllTvs: () => void;
}

const ERROR_SIGNATURES: Record<TVErrorType, { signature: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; priority: 'P0' | 'P1' | 'P2' | 'P3' }> = {
  HDMI_HANDSHAKE_LOSS: { signature: 'ERR_SIG_HDMI_SYNCLOSS_0x82', severity: 'HIGH', priority: 'P1' },
  POWER_CYCLE_FAILURE: { signature: 'ERR_SIG_PWR_INVERTER_FAULT_0x44', severity: 'CRITICAL', priority: 'P0' },
  IR_RECEIVER_TIMEOUT: { signature: 'ERR_SIG_IR_BURST_NOACK_0x1F', severity: 'MEDIUM', priority: 'P2' },
  SIGNAL_DESYNC: { signature: 'ERR_SIG_EDID_REFRESH_DESYNC_0x09', severity: 'LOW', priority: 'P3' },
  EDID_CORRUPTION: { signature: 'ERR_SIG_EDID_CRC_MISMATCH_0xEE', severity: 'HIGH', priority: 'P1' }
};

export const generateLabLayout = (dims: LabDimensions) => {
  const stands: Record<string, StandState> = {};
  const tvs: Record<string, TVState> = {};
  const cameras: CameraSensor[] = [];

  const { rows, cols, standSpacingX, standSpacingZ, totalActiveTvs } = dims;

  let tvCounter = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const standId = `STAND-R${r + 1}C${c + 1}`;
      const posX = (c - (cols - 1) / 2) * standSpacingX;
      const posZ = (r - (rows - 1) / 2) * standSpacingZ;
      const position: [number, number, number] = [posX, 0, posZ];

      const standTvIds: string[] = [];

      // 6 TVs per stand: 3 front aisle, 3 back aisle
      // levels: 0 (bottom ~1.2m), 1 (mid ~2.2m), 2 (top ~3.2m)
      const sides: ('front' | 'back')[] = ['front', 'back'];

      for (const side of sides) {
        for (let level = 0; level < 3; level++) {
          if (tvCounter >= totalActiveTvs) break;
          tvCounter++;
          const tvId = `TV-${String(tvCounter).padStart(2, '0')}`;
          standTvIds.push(tvId);

          tvs[tvId] = {
            id: tvId,
            standId,
            row: r,
            col: c,
            side,
            level,
            status: 'healthy',
            signalStrength: 98 + Math.floor(Math.random() * 3),
            latencyMs: 12 + Math.floor(Math.random() * 8),
            temperatureC: 38 + Math.floor(Math.random() * 4),
          };
        }
      }

      stands[standId] = {
        id: standId,
        row: r,
        col: c,
        position,
        tvIds: standTvIds,
      };
    }
  }

  // Camera sensors placed in aisles between rows and front/back
  for (let r = 0; r <= rows; r++) {
    const aisleZ = (r - rows / 2) * standSpacingZ;
    for (let c = 0; c < cols; c++) {
      const aisleX = (c - (cols - 1) / 2) * standSpacingX;
      cameras.push({
        id: `CAM-AISLE-${r}-${c}`,
        position: [aisleX, 3.8, aisleZ],
        aisleIndex: r,
        isInspecting: false,
        focusedTvId: null
      });
    }
  }

  return { stands, tvs, cameras };
};

const initialDims: LabDimensions = {
  rows: 4,
  cols: 3,
  standSpacingX: 7.5,
  standSpacingZ: 6.5,
  tvsPerStand: 6,
  totalActiveTvs: 70
};

const initialLayout = generateLabLayout(initialDims);

const sleepBenchPos: [number, number, number] = [-15, 0.6, 0];

export const useLabStore = create<LabStoreState>((set, get) => ({
  dimensions: initialDims,
  tvs: initialLayout.tvs,
  stands: initialLayout.stands,
  cameras: initialLayout.cameras,
  bot: {
    id: 'MAINTENANCE_DRONE_ALPHA',
    name: 'AeroBot-MK4',
    position: [...sleepBenchPos],
    targetPosition: [...sleepBenchPos],
    currentStandId: null,
    targetStandId: null,
    currentTvId: null,
    phase: 'SLEEP_BENCH',
    phaseProgress: 100,
    activeStepLabel: 'Dormant at Sleep Bench (Telemetry Nominal)',
    homePosition: [...sleepBenchPos],
    batteryLevel: 98,
    retryAttempts: 0
  },
  logs: [
    {
      id: 'init-001',
      timestamp: new Date().toISOString().substring(11, 19),
      sender: 'BACKEND_ORCHESTRATOR',
      recipient: 'ALL',
      severity: 'LOW',
      error_signature: 'SYS_BOOT_INITIALIZE_OK',
      assigned_priority: 'P3',
      message: 'Physical Matrix Boot Complete. 70 TVs operational across 4x3 stand grid.'
    },
    {
      id: 'init-002',
      timestamp: new Date().toISOString().substring(11, 19),
      sender: 'TEST_AGENT',
      recipient: 'BACKEND_ORCHESTRATOR',
      severity: 'LOW',
      error_signature: 'HEARTBEAT_ACK',
      assigned_priority: 'P3',
      message: 'IR Signal bus online. Packet drop watchdog primed at 8.0% simulation rate.'
    }
  ],
  hardwareConfig: {
    packetDropRate: 0.08,
    propagationDelayMs: 220,
    autoAnomalyIntervalMs: 10000,
    isSimulationRunning: true
  },
  selectedTvId: 'TV-01',
  cameraFocusTarget: null,
  cameraMode: 'ORBIT_ROOM',
  copilotSpeaking: false,
  activeCopilotTranscript: 'Autonomous Lab Copilot is online. Monitoring 70 TV panels across 12 floor mounts.',

  updateDimensions: (rows, cols, spacingX, spacingZ) => {
    const newDims: LabDimensions = {
      rows,
      cols,
      standSpacingX: spacingX ?? 7.5,
      standSpacingZ: spacingZ ?? 6.5,
      tvsPerStand: 6,
      totalActiveTvs: Math.min(rows * cols * 6, 100)
    };
    const layout = generateLabLayout(newDims);
    set({
      dimensions: newDims,
      tvs: layout.tvs,
      stands: layout.stands,
      cameras: layout.cameras,
      selectedTvId: Object.keys(layout.tvs)[0] || null
    });
    get().addLogMessage({
      sender: 'BACKEND_ORCHESTRATOR',
      recipient: 'ALL',
      severity: 'MEDIUM',
      error_signature: 'RECONFIG_GRID_PARAMETRIC',
      assigned_priority: 'P2',
      message: `Grid scaled to ${rows}x${cols} floor stands (${Object.keys(layout.tvs).length} active TVs). Layout adapted parametrically.`
    });
  },

  setTVStatus: (id, status, errorType) => {
    set(state => {
      const tv = state.tvs[id];
      if (!tv) return state;
      return {
        tvs: {
          ...state.tvs,
          [id]: {
            ...tv,
            status,
            errorType: errorType ?? tv.errorType,
            lastFaultTimestamp: status === 'failing' ? Date.now() : tv.lastFaultTimestamp
          }
        }
      };
    });
  },

  updateTV: (id, partial) => {
    set(state => {
      const tv = state.tvs[id];
      if (!tv) return state;
      return {
        tvs: {
          ...state.tvs,
          [id]: { ...tv, ...partial }
        }
      };
    });
  },

  updateBot: (partial) => {
    set(state => ({
      bot: { ...state.bot, ...partial }
    }));
  },

  addLogMessage: (msg) => {
    const fullMsg: AgentStructuredMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().substring(11, 19)
    };
    set(state => ({
      logs: [fullMsg, ...state.logs.slice(0, 75)] // keep last 75 messages
    }));
  },

  clearLogs: () => set({ logs: [] }),

  setSelectedTvId: (id) => set({ selectedTvId: id }),

  setCameraMode: (mode, target) => {
    set({
      cameraMode: mode,
      cameraFocusTarget: target || null
    });
  },

  setHardwareConfig: (partial) => {
    set(state => ({
      hardwareConfig: { ...state.hardwareConfig, ...partial }
    }));
  },

  triggerManualAnomaly: (targetTvId) => {
    const { tvs, stands, addLogMessage } = get();
    const candidateIds = Object.keys(tvs).filter(id => tvs[id].status === 'healthy');
    const chosenTvId = targetTvId && tvs[targetTvId] ? targetTvId : candidateIds[Math.floor(Math.random() * candidateIds.length)];

    if (!chosenTvId) return;

    const errorTypes: TVErrorType[] = [
      'HDMI_HANDSHAKE_LOSS',
      'POWER_CYCLE_FAILURE',
      'IR_RECEIVER_TIMEOUT',
      'SIGNAL_DESYNC',
      'EDID_CORRUPTION'
    ];
    const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    const meta = ERROR_SIGNATURES[errorType];
    const tv = tvs[chosenTvId];

    set(state => ({
      tvs: {
        ...state.tvs,
        [chosenTvId]: {
          ...tv,
          status: 'failing',
          errorType,
          signalStrength: Math.floor(Math.random() * 25),
          latencyMs: 380 + Math.floor(Math.random() * 200),
          temperatureC: 48 + Math.floor(Math.random() * 10),
          lastFaultTimestamp: Date.now()
        }
      },
      selectedTvId: chosenTvId
    }));

    // Test Agent detects anomaly and alerts Repair Agent with structured JSON
    addLogMessage({
      sender: 'TEST_AGENT',
      recipient: 'REPAIR_AGENT',
      severity: meta.severity,
      error_signature: meta.signature,
      assigned_priority: meta.priority,
      tvId: chosenTvId,
      standId: tv.standId,
      message: `Automated diagnostic detected anomaly on ${chosenTvId} (${tv.standId}, Level ${tv.level}, ${tv.side.toUpperCase()}). ${errorType.replace(/_/g, ' ')}. Latency spiked to ${tv.latencyMs}ms.`,
      metadata: {
        voltage: '11.8V (Unstable)',
        crc_error_rate: '28.4%',
        targetAisle: tv.side === 'front' ? 'FRONT_AISLE' : 'BACK_AISLE'
      }
    });
  },

  setCopilotSpeaking: (speaking, transcript) => {
    set(state => ({
      copilotSpeaking: speaking,
      activeCopilotTranscript: transcript ?? state.activeCopilotTranscript
    }));
  },

  resetAllTvs: () => {
    const { tvs, addLogMessage } = get();
    const restored: Record<string, TVState> = {};
    for (const [id, tv] of Object.entries(tvs)) {
      restored[id] = {
        ...tv,
        status: 'healthy',
        errorType: undefined,
        signalStrength: 98,
        latencyMs: 14,
        temperatureC: 38
      };
    }
    set({ tvs: restored });
    addLogMessage({
      sender: 'BACKEND_ORCHESTRATOR',
      recipient: 'ALL',
      severity: 'LOW',
      error_signature: 'SYS_RESET_FULL',
      assigned_priority: 'P3',
      message: 'Global override: All 70 TV displays restored to healthy operational baseline.'
    });
  }
}));

