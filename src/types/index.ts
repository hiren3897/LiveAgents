export type TVStatus = 'healthy' | 'failing' | 'repairing' | 'offline';

export type TVErrorType = 
  | 'HDMI_HANDSHAKE_LOSS'
  | 'POWER_CYCLE_FAILURE'
  | 'IR_RECEIVER_TIMEOUT'
  | 'SIGNAL_DESYNC'
  | 'EDID_CORRUPTION';

export interface TVState {
  id: string;
  standId: string;
  row: number;
  col: number;
  side: 'front' | 'back';
  level: number; // 0: bottom, 1: middle, 2: top
  status: TVStatus;
  errorType?: TVErrorType;
  signalStrength: number; // 0 - 100
  latencyMs: number;
  temperatureC: number;
  lastFaultTimestamp?: number;
  repairPhaseProgress?: number;
}

export interface StandState {
  id: string;
  row: number;
  col: number;
  position: [number, number, number];
  tvIds: string[];
}

export type BotPhase = 
  | 'SLEEP_BENCH'
  | 'NAVIGATING'
  | 'ANALYZING_FEED'
  | 'TRANSMITTING_IR'
  | 'VERIFYING_SYNC'
  | 'SYSTEM_RESTORED';

export interface MaintenanceBot {
  id: string;
  name: string;
  position: [number, number, number];
  targetPosition: [number, number, number];
  currentStandId: string | null;
  targetStandId: string | null;
  currentTvId: string | null;
  phase: BotPhase;
  phaseProgress: number; // 0 - 100
  activeStepLabel: string;
  homePosition: [number, number, number];
  batteryLevel: number;
  retryAttempts: number;
  lastRepairedTvId?: string;
}

export type MessageSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AssignedPriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface AgentStructuredMessage {
  id: string;
  timestamp: string;
  sender: 'TEST_AGENT' | 'REPAIR_AGENT' | 'BACKEND_ORCHESTRATOR' | 'COPILOT_BRAIN';
  recipient: 'TEST_AGENT' | 'REPAIR_AGENT' | 'BACKEND_ORCHESTRATOR' | 'COPILOT_BRAIN' | 'ALL';
  severity: MessageSeverity;
  error_signature: string;
  assigned_priority: AssignedPriority;
  tvId?: string;
  standId?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface LabDimensions {
  rows: number;
  cols: number;
  standSpacingX: number;
  standSpacingZ: number;
  tvsPerStand: number;
  totalActiveTvs: number;
}

export interface HardwareSimConfig {
  packetDropRate: number; // e.g. 0.08 (8% packet drop rate)
  propagationDelayMs: number; // e.g. 240ms
  autoAnomalyIntervalMs: number; // e.g. 8000ms
  isSimulationRunning: boolean;
}

export interface CameraSensor {
  id: string;
  position: [number, number, number];
  aisleIndex: number;
  isInspecting: boolean;
  focusedTvId: string | null;
}

