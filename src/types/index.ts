export type TVStatus = 'HEALTHY' | 'BROKEN' | 'REPAIRING';

export type TVErrorType =
  | 'HDMI_HANDSHAKE_LOST'
  | 'FROZEN_VIDEO_FRAME'
  | 'BACKLIGHT_INVERTER_FAULT'
  | 'EDID_SYNC_TIMEOUT'
  | 'CEC_BUS_COLLISION';

export interface TVItem {
  id: string; // e.g. "TV-01" to "TV-70"
  standId: string; // e.g. "STAND-R1-C1"
  row: number; // 0..3
  col: number; // 0..2
  side: 'front' | 'back';
  slot: number; // 0 (bottom), 1 (middle), 2 (top)
  status: TVStatus;
  error?: TVErrorType;
  errorCode?: string;
  latencyMs: number;
  temperatureC: number;
  lastFaultTime?: number;
}

export interface StandData {
  id: string;
  row: number;
  col: number;
  position: [number, number, number];
  tvIds: string[];
}

export type BotPhase =
  | 'SLEEPING'
  | 'DISPATCHED'
  | 'WALKING_TO_STAND'
  | 'SCANNING_VIA_ROW_CAMERA'
  | 'SENDING_IR_SIGNAL'
  | 'VERIFYING_FIX'
  | 'RETURNING_TO_DESK';

export interface Waypoint {
  x: number;
  z: number;
}

export interface CreatureBotState {
  name: string;
  phase: BotPhase;
  currentTvId: string | null;
  targetStandId: string | null;
  activeStepLabel: string;
  battery: number;
  mood: 'SLEEPING' | 'WALKING' | 'REPAIRING' | 'HAPPY';
  
  // High-frequency runtime waypoint coordinates
  homePosition: [number, number, number];
  currentPos: [number, number, number];
  targetPos: [number, number, number];
  waypoints: Waypoint[];
  currentWaypointIndex: number;
  facingAngle: number;
  targetFacingAngle: number;
  
  // Phase progress (0 to 100)
  phaseProgress: number;
}

export interface DiagnosticTicket {
  id: string;
  severity: 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM';
  tvId: string;
  standId: string;
  row: number;
  col: number;
  side: 'front' | 'back';
  slot: number;
  error: TVErrorType;
  errorCode: string;
  timestamp: string;
}

export interface AgentLogMessage {
  id: string;
  timestamp: string;
  sender: 'TEST_RUNNER' | 'CREATURE_BOT' | 'LAB_SUPERVISOR' | 'SYSTEM';
  recipient: 'TEST_RUNNER' | 'CREATURE_BOT' | 'LAB_SUPERVISOR' | 'ALL';
  type: 'TICKET_DISPATCH' | 'BOT_ACK' | 'SCAN_FEED' | 'IR_BURST' | 'VERIFY_OK' | 'SYSTEM_INFO';
  message: string;
  ticket?: DiagnosticTicket;
  rawJson?: Record<string, unknown>;
}

export interface OverheadCamera {
  id: string;
  row: number;
  position: [number, number, number];
  targetLookAt: [number, number, number];
  isActive: boolean;
}
