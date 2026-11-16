import { create } from 'zustand';
import { 
  TVItem, 
  StandData, 
  CreatureBotState, 
  DiagnosticTicket, 
  AgentLogMessage, 
  OverheadCamera, 
  TVErrorType,
  Waypoint
} from '../types';

// Physical Layout Constants
export const DESK_POSITION: [number, number, number] = [-8, 0, -7];
export const MAIN_WALKWAY_X = -7.0;

export const ROW_Z_COORDS = [-4.5, -1.5, 1.5, 4.5]; // 4 rows
export const COL_X_COORDS = [-3.8, 0.6, 5.0];       // 3 columns

export const ERROR_CATALOG: Record<TVErrorType, { code: string; label: string; severity: 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' }> = {
  HDMI_HANDSHAKE_LOST: { code: 'ERR_TMDS_CLK_UNSTABLE_0x82', label: 'HDMI Handshake Lost', severity: 'P1_HIGH' },
  FROZEN_VIDEO_FRAME: { code: 'ERR_BUFFER_LOCK_0x3F', label: 'Frozen Video Frame Buffer', severity: 'P2_MEDIUM' },
  BACKLIGHT_INVERTER_FAULT: { code: 'ERR_PWR_INVERTER_0x0A', label: 'Backlight Inverter Fault', severity: 'P0_CRITICAL' },
  EDID_SYNC_TIMEOUT: { code: 'ERR_EDID_CRC_MISMATCH_0xEE', label: 'EDID Sync Packet Timeout', severity: 'P1_HIGH' },
  CEC_BUS_COLLISION: { code: 'ERR_CEC_LINE_CONT_0x1C', label: 'CEC Bus Line Collision', severity: 'P2_MEDIUM' },
};

// Generate Exactly 70 TVs across 12 Stands
function generateInitialLabSetup(): { tvs: Record<string, TVItem>; stands: Record<string, StandData>; cameras: OverheadCamera[] } {
  const tvs: Record<string, TVItem> = {};
  const stands: Record<string, StandData> = {};
  const cameras: OverheadCamera[] = [];

  let tvCounter = 0;
  const maxTvs = 70;

  for (let r = 0; r < ROW_Z_COORDS.length; r++) {
    for (let c = 0; c < COL_X_COORDS.length; c++) {
      const standId = `STAND-R${r + 1}-C${c + 1}`;
      const posX = COL_X_COORDS[c];
      const posZ = ROW_Z_COORDS[r];
      const tvIds: string[] = [];

      // 11 stands have 6 TVs (3 front, 3 back). Stand 12 (R4-C3) has 4 TVs (2 front, 2 back) = 70 TVs exactly
      const isLastStand = (r === ROW_Z_COORDS.length - 1) && (c === COL_X_COORDS.length - 1);
      const slotsPerSide = isLastStand ? 2 : 3;

      (['front', 'back'] as const).forEach(side => {
        for (let slot = 0; slot < slotsPerSide; slot++) {
          if (tvCounter >= maxTvs) break;
          tvCounter++;
          const tvId = `TV-${String(tvCounter).padStart(2, '0')}`;
          tvIds.push(tvId);

          tvs[tvId] = {
            id: tvId,
            standId,
            row: r,
            col: c,
            side,
            slot,
            status: 'HEALTHY',
            latencyMs: 12 + Math.floor(Math.random() * 8),
            temperatureC: 38 + Math.floor(Math.random() * 4),
          };
        }
      });

      stands[standId] = {
        id: standId,
        row: r,
        col: c,
        position: [posX, 0, posZ],
        tvIds,
      };
    }

    // 2 Overhead/Aisle cameras per row = 8 total
    cameras.push({
      id: `CAM-R${r + 1}-WEST`,
      row: r,
      position: [-1.6, 3.6, ROW_Z_COORDS[r]],
      targetLookAt: [-1.6, 1.5, ROW_Z_COORDS[r]],
      isActive: false
    });
    cameras.push({
      id: `CAM-R${r + 1}-EAST`,
      row: r,
      position: [2.8, 3.6, ROW_Z_COORDS[r]],
      targetLookAt: [2.8, 1.5, ROW_Z_COORDS[r]],
      isActive: false
    });
  }

  return { tvs, stands, cameras };
}

const initialSetup = generateInitialLabSetup();

export interface LabStore {
  // Matrix State
  tvs: Record<string, TVItem>;
  stands: Record<string, StandData>;
  cameras: OverheadCamera[];
  selectedTvId: string | null;
  activeTicket: DiagnosticTicket | null;

  // Bot State
  bot: CreatureBotState;

  // Swarm Comms & Logs
  logs: AgentLogMessage[];

  // Judge Controls & Simulation Settings
  simSpeed: 1 | 2;
  cameraMode: 'AUTO_FOLLOW' | 'FREE_ORBIT';
  voiceEnabled: boolean;
  isCopilotSpeaking: boolean;
  activeCopilotSpeech: string;
  autoFailureTimerActive: boolean;

  // Actions
  setSelectedTvId: (id: string | null) => void;
  setSimSpeed: (speed: 1 | 2) => void;
  setCameraMode: (mode: 'AUTO_FOLLOW' | 'FREE_ORBIT') => void;
  setVoiceEnabled: (enabled: boolean) => void;
  triggerManualFailure: (targetTvId?: string) => void;
  fixAllTvs: () => void;
  addLogMessage: (log: Omit<AgentLogMessage, 'id' | 'timestamp'>) => void;
  setCopilotSpeaking: (speaking: boolean, text?: string) => void;
  
  // High-frequency simulation steps (called by internal loop / useFrame)
  tickSimulation: (delta: number) => void;
}

export const useLabStore = create<LabStore>((set, get) => ({
  tvs: initialSetup.tvs,
  stands: initialSetup.stands,
  cameras: initialSetup.cameras,
  selectedTvId: 'TV-01',
  activeTicket: null,

  bot: {
    name: 'BytePaws-MK1',
    phase: 'SLEEPING',
    currentTvId: null,
    targetStandId: null,
    activeStepLabel: '💤 Charging at Desk',
    battery: 100,
    mood: 'SLEEPING',
    homePosition: [...DESK_POSITION],
    currentPos: [...DESK_POSITION],
    targetPos: [...DESK_POSITION],
    waypoints: [],
    currentWaypointIndex: 0,
    facingAngle: -Math.PI / 2,
    targetFacingAngle: -Math.PI / 2,
    phaseProgress: 100,
  },

  logs: [
    {
      id: 'log-001',
      timestamp: '00:00:01',
      sender: 'SYSTEM',
      recipient: 'ALL',
      type: 'SYSTEM_INFO',
      message: 'Physical Lab Initialized. 70 TVs across 12 stands (4 Rows x 3 Cols). All systems nominal.',
    },
    {
      id: 'log-002',
      timestamp: '00:00:02',
      sender: 'TEST_RUNNER',
      recipient: 'CREATURE_BOT',
      type: 'SYSTEM_INFO',
      message: 'Automated TMDS Video Matrix & CEC Polling watchdog armed. 8 Aisle Cameras online.',
    }
  ],

  simSpeed: 1,
  cameraMode: 'AUTO_FOLLOW',
  voiceEnabled: true,
  isCopilotSpeaking: false,
  activeCopilotSpeech: 'Creature Bot online. Monitoring 70 TV panels across the automation lab!',
  autoFailureTimerActive: true,

  setSelectedTvId: (id) => set({ selectedTvId: id }),
  setSimSpeed: (speed) => set({ simSpeed: speed }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),

  setCopilotSpeaking: (speaking, text) => {
    set(state => ({
      isCopilotSpeaking: speaking,
      activeCopilotSpeech: text !== undefined ? text : state.activeCopilotSpeech
    }));
  },

  addLogMessage: (log) => {
    const fullLog: AgentLogMessage = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toTimeString().split(' ')[0]
    };
    set(state => ({
      logs: [fullLog, ...state.logs.slice(0, 59)] // maintain last 60 events
    }));
  },

  triggerManualFailure: (targetTvId) => {
    const { tvs, bot, addLogMessage, stands } = get();

    // Pick target
    let tvId = targetTvId;
    if (!tvId) {
      const healthyIds = Object.keys(tvs).filter(id => tvs[id].status === 'HEALTHY');
      if (healthyIds.length === 0) return;
      tvId = healthyIds[Math.floor(Math.random() * healthyIds.length)];
    }

    const tv = tvs[tvId];
    if (!tv || tv.status !== 'HEALTHY') return;

    // Pick random error
    const errorKeys = Object.keys(ERROR_CATALOG) as TVErrorType[];
    const chosenErrorKey = errorKeys[Math.floor(Math.random() * errorKeys.length)];
    const errorMeta = ERROR_CATALOG[chosenErrorKey];

    const ticket: DiagnosticTicket = {
      id: `TCK-${Date.now().toString().slice(-4)}`,
      severity: errorMeta.severity,
      tvId: tv.id,
      standId: tv.standId,
      row: tv.row,
      col: tv.col,
      side: tv.side,
      slot: tv.slot,
      error: chosenErrorKey,
      errorCode: errorMeta.code,
      timestamp: new Date().toTimeString().split(' ')[0]
    };

    // Update TV status
    set(state => ({
      tvs: {
        ...state.tvs,
        [tvId!]: {
          ...state.tvs[tvId!],
          status: 'BROKEN',
          error: chosenErrorKey,
          errorCode: errorMeta.code,
          latencyMs: 340 + Math.floor(Math.random() * 200),
          lastFaultTime: Date.now()
        }
      },
      selectedTvId: tvId!,
      activeTicket: ticket
    }));

    // Emit Test Runner Ticket
    addLogMessage({
      sender: 'TEST_RUNNER',
      recipient: 'CREATURE_BOT',
      type: 'TICKET_DISPATCH',
      message: `ANOMALY DETECTED on ${tv.id} [${tv.standId}, ${tv.side.toUpperCase()}, Slot ${tv.slot + 1}]: ${errorMeta.label}. Ticket #${ticket.id} emitted.`,
      ticket,
      rawJson: { ...ticket }
    });

    // If bot is sleeping, dispatch immediately
    if (bot.phase === 'SLEEPING') {
      const stand = stands[tv.standId];
      const targetAisleZ = stand.position[2] + (tv.side === 'front' ? 1.15 : -1.15);
      const targetX = stand.position[0];

      // Aisle Waypoint Pathfinding:
      // Waypoint 0: step from desk to main walkway [-7.0, -7.0]
      // Waypoint 1: walk along main walkway to target aisle [-7.0, targetAisleZ]
      // Waypoint 2: walk straight down aisle to stand [targetX, targetAisleZ]
      const waypoints: Waypoint[] = [
        { x: MAIN_WALKWAY_X, z: DESK_POSITION[2] },
        { x: MAIN_WALKWAY_X, z: targetAisleZ },
        { x: targetX, z: targetAisleZ }
      ];

      // Facing angle when in front of TV:
      // Front side: TV faces +Z, so bot looks -Z (angle = Math.PI)
      // Back side: TV faces -Z, so bot looks +Z (angle = 0)
      const targetFacing = tv.side === 'front' ? Math.PI : 0;

      set(state => ({
        bot: {
          ...state.bot,
          phase: 'DISPATCHED',
          currentTvId: tv.id,
          targetStandId: tv.standId,
          activeStepLabel: `🚨 Ticket #${ticket.id} Dispatched: ${tv.id}`,
          mood: 'WALKING',
          waypoints,
          currentWaypointIndex: 0,
          targetFacingAngle: 0,
          phaseProgress: 0
        }
      }));

      addLogMessage({
        sender: 'CREATURE_BOT',
        recipient: 'TEST_RUNNER',
        type: 'BOT_ACK',
        message: `ACK Ticket #${ticket.id}. Awakening from charging desk. Calculating aisle path to ${tv.standId}...`
      });
    }
  },

  fixAllTvs: () => {
    const { tvs, addLogMessage } = get();
    const updated = { ...tvs };
    for (const id in updated) {
      updated[id] = {
        ...updated[id],
        status: 'HEALTHY',
        error: undefined,
        errorCode: undefined,
        latencyMs: 14,
        temperatureC: 38
      };
    }

    set(state => ({
      tvs: updated,
      activeTicket: null,
      bot: {
        ...state.bot,
        phase: 'RETURNING_TO_DESK',
        currentTvId: null,
        targetStandId: null,
        activeStepLabel: '🦆 Returning to Charging Desk',
        mood: 'WALKING',
        waypoints: [
          { x: MAIN_WALKWAY_X, z: state.bot.currentPos[2] },
          { x: MAIN_WALKWAY_X, z: DESK_POSITION[2] },
          { x: DESK_POSITION[0], z: DESK_POSITION[2] }
        ],
        currentWaypointIndex: 0,
        targetFacingAngle: -Math.PI / 2,
        phaseProgress: 0
      }
    }));

    addLogMessage({
      sender: 'LAB_SUPERVISOR',
      recipient: 'ALL',
      type: 'SYSTEM_INFO',
      message: 'Global Manual Override executed: All 70 TV panels restored to HEALTHY.'
    });
  },

  // State Machine Step Logic
  tickSimulation: (delta: number) => {
    const state = get();
    const { bot, tvs, stands, simSpeed, addLogMessage, triggerManualFailure } = state;

    // Auto-failure generator when bot is sleeping
    if (bot.phase === 'SLEEPING') {
      const brokenCount = Object.values(tvs).filter(t => t.status === 'BROKEN').length;
      if (brokenCount === 0 && Math.random() < 0.003 * simSpeed) {
        triggerManualFailure();
      }
      return;
    }

    const currentTv = bot.currentTvId ? tvs[bot.currentTvId] : null;

    switch (bot.phase) {
      case 'DISPATCHED': {
        // Brief pause to wake up
        const nextProgress = bot.phaseProgress + delta * 70 * simSpeed;
        if (nextProgress >= 100) {
          set(s => ({
            bot: {
              ...s.bot,
              phase: 'WALKING_TO_STAND',
              activeStepLabel: `🦆 Walking to ${s.bot.targetStandId} (${currentTv?.id || ''})`,
              mood: 'WALKING',
              phaseProgress: 0
            }
          }));
        } else {
          set(s => ({ bot: { ...s.bot, phaseProgress: nextProgress } }));
        }
        break;
      }

      case 'WALKING_TO_STAND': {
        // High frequency movement through waypoints
        const waypoints = bot.waypoints;
        const wpIdx = bot.currentWaypointIndex;

        if (wpIdx < waypoints.length) {
          const targetWp = waypoints[wpIdx];
          const curX = bot.currentPos[0];
          const curZ = bot.currentPos[2];

          const dx = targetWp.x - curX;
          const dz = targetWp.z - curZ;
          const dist = Math.hypot(dx, dz);

          const walkSpeed = 3.6 * simSpeed * delta;

          if (dist < 0.15) {
            // Next waypoint
            const nextIdx = wpIdx + 1;
            if (nextIdx < waypoints.length) {
              set(s => ({
                bot: {
                  ...s.bot,
                  currentWaypointIndex: nextIdx,
                  targetFacingAngle: Math.atan2(waypoints[nextIdx].x - targetWp.x, waypoints[nextIdx].z - targetWp.z)
                }
              }));
            } else {
              // Reached final stand destination!
              const finalFacing = currentTv?.side === 'front' ? Math.PI : 0;
              set(s => ({
                bot: {
                  ...s.bot,
                  phase: 'SCANNING_VIA_ROW_CAMERA',
                  activeStepLabel: `🔍 Scanning via Row Camera: ${currentTv?.id || ''}`,
                  mood: 'REPAIRING',
                  targetFacingAngle: finalFacing,
                  phaseProgress: 0
                }
              }));

              addLogMessage({
                sender: 'CREATURE_BOT',
                recipient: 'TEST_RUNNER',
                type: 'SCAN_FEED',
                message: `Arrived at ${currentTv?.standId}. Position locked 1.1m from screen face. Requesting row camera optical stream.`
              });
            }
          } else {
            // Move along segment
            const moveX = curX + (dx / dist) * Math.min(dist, walkSpeed);
            const moveZ = curZ + (dz / dist) * Math.min(dist, walkSpeed);
            const moveAngle = Math.atan2(dx, dz);

            set(s => ({
              bot: {
                ...s.bot,
                currentPos: [moveX, 0, moveZ],
                facingAngle: moveAngle,
                targetFacingAngle: moveAngle
              }
            }));
          }
        }
        break;
      }

      case 'SCANNING_VIA_ROW_CAMERA': {
        const nextProgress = bot.phaseProgress + delta * 50 * simSpeed;
        if (nextProgress >= 100) {
          // Transition to SENDING_IR_SIGNAL
          if (currentTv) {
            set(s => ({
              tvs: {
                ...s.tvs,
                [currentTv.id]: {
                  ...s.tvs[currentTv.id],
                  status: 'REPAIRING'
                }
              },
              bot: {
                ...s.bot,
                phase: 'SENDING_IR_SIGNAL',
                activeStepLabel: `📡 Sending IR Reboot Pulse to ${currentTv.id}`,
                mood: 'REPAIRING',
                phaseProgress: 0
              }
            }));

            addLogMessage({
              sender: 'CREATURE_BOT',
              recipient: 'TEST_RUNNER',
              type: 'IR_BURST',
              message: `Transmitting IR Hex Pulse [0x3E, 0xA1, 0x09] to ${currentTv.id}. Forcing hardware reset sequence.`
            });
          }
        } else {
          set(s => ({ bot: { ...s.bot, phaseProgress: nextProgress } }));
        }
        break;
      }

      case 'SENDING_IR_SIGNAL': {
        const nextProgress = bot.phaseProgress + delta * 40 * simSpeed;
        if (nextProgress >= 100) {
          set(s => ({
            bot: {
              ...s.bot,
              phase: 'VERIFYING_FIX',
              activeStepLabel: `✅ Verifying HDMI TMDS Clock on ${currentTv?.id || ''}`,
              mood: 'REPAIRING',
              phaseProgress: 0
            }
          }));

          addLogMessage({
            sender: 'TEST_RUNNER',
            recipient: 'CREATURE_BOT',
            type: 'VERIFY_OK',
            message: `Pixel Clock Synced. Reading 60.0 FPS stable video raster on ${currentTv?.id}. Handshake OK.`
          });
        } else {
          set(s => ({ bot: { ...s.bot, phaseProgress: nextProgress } }));
        }
        break;
      }

      case 'VERIFYING_FIX': {
        const nextProgress = bot.phaseProgress + delta * 60 * simSpeed;
        if (nextProgress >= 100) {
          // TV is now HEALTHY
          if (currentTv) {
            set(s => ({
              tvs: {
                ...s.tvs,
                [currentTv.id]: {
                  ...s.tvs[currentTv.id],
                  status: 'HEALTHY',
                  error: undefined,
                  errorCode: undefined,
                  latencyMs: 13
                }
              }
            }));
          }

          // Check if any other TVs are broken
          const remainingBroken = Object.values(tvs).filter(t => t.status === 'BROKEN' && t.id !== currentTv?.id);

          if (remainingBroken.length > 0) {
            // Next target!
            const nextTv = remainingBroken[0];
            const nextStand = stands[nextTv.standId];
            const targetAisleZ = nextStand.position[2] + (nextTv.side === 'front' ? 1.15 : -1.15);
            const targetX = nextStand.position[0];

            const waypoints: Waypoint[] = [
              { x: MAIN_WALKWAY_X, z: bot.currentPos[2] },
              { x: MAIN_WALKWAY_X, z: targetAisleZ },
              { x: targetX, z: targetAisleZ }
            ];

            set(s => ({
              bot: {
                ...s.bot,
                phase: 'WALKING_TO_STAND',
                currentTvId: nextTv.id,
                targetStandId: nextTv.standId,
                activeStepLabel: `🦆 Re-routed to Broken ${nextTv.id} (${nextTv.standId})`,
                mood: 'WALKING',
                waypoints,
                currentWaypointIndex: 0,
                phaseProgress: 0
              }
            }));

            addLogMessage({
              sender: 'TEST_RUNNER',
              recipient: 'CREATURE_BOT',
              type: 'TICKET_DISPATCH',
              message: `TV ${currentTv?.id} RESTORED! Queue not empty: Re-routing bot to ${nextTv.id} on ${nextTv.standId}.`
            });
          } else {
            // Return to desk!
            const waypoints: Waypoint[] = [
              { x: MAIN_WALKWAY_X, z: bot.currentPos[2] },
              { x: MAIN_WALKWAY_X, z: DESK_POSITION[2] },
              { x: DESK_POSITION[0], z: DESK_POSITION[2] }
            ];

            set(s => ({
              activeTicket: null,
              bot: {
                ...s.bot,
                phase: 'RETURNING_TO_DESK',
                activeStepLabel: '🦆 Returning to Charging Desk',
                mood: 'WALKING',
                waypoints,
                currentWaypointIndex: 0,
                targetFacingAngle: -Math.PI / 2,
                phaseProgress: 0
              }
            }));

            addLogMessage({
              sender: 'CREATURE_BOT',
              recipient: 'LAB_SUPERVISOR',
              type: 'BOT_ACK',
              message: `All 70 lab displays nominal! Returning to maintenance charging desk.`
            });
          }
        } else {
          set(s => ({ bot: { ...s.bot, phaseProgress: nextProgress } }));
        }
        break;
      }

      case 'RETURNING_TO_DESK': {
        const waypoints = bot.waypoints;
        const wpIdx = bot.currentWaypointIndex;

        if (wpIdx < waypoints.length) {
          const targetWp = waypoints[wpIdx];
          const curX = bot.currentPos[0];
          const curZ = bot.currentPos[2];

          const dx = targetWp.x - curX;
          const dz = targetWp.z - curZ;
          const dist = Math.hypot(dx, dz);

          const walkSpeed = 3.6 * simSpeed * delta;

          if (dist < 0.15) {
            const nextIdx = wpIdx + 1;
            if (nextIdx < waypoints.length) {
              set(s => ({
                bot: {
                  ...s.bot,
                  currentWaypointIndex: nextIdx,
                  targetFacingAngle: Math.atan2(waypoints[nextIdx].x - targetWp.x, waypoints[nextIdx].z - targetWp.z)
                }
              }));
            } else {
              // Reached desk! Settle to sleep
              set(s => ({
                bot: {
                  ...s.bot,
                  phase: 'SLEEPING',
                  currentTvId: null,
                  targetStandId: null,
                  activeStepLabel: '💤 Charging at Desk',
                  mood: 'SLEEPING',
                  facingAngle: -Math.PI / 2,
                  targetFacingAngle: -Math.PI / 2,
                  phaseProgress: 100
                }
              }));

              addLogMessage({
                sender: 'CREATURE_BOT',
                recipient: 'SYSTEM',
                type: 'BOT_ACK',
                message: 'Docked on charging pad. Power level 100%. Standing by for telemetry alerts.'
              });
            }
          } else {
            const moveX = curX + (dx / dist) * Math.min(dist, walkSpeed);
            const moveZ = curZ + (dz / dist) * Math.min(dist, walkSpeed);
            const moveAngle = Math.atan2(dx, dz);

            set(s => ({
              bot: {
                ...s.bot,
                currentPos: [moveX, 0, moveZ],
                facingAngle: moveAngle,
                targetFacingAngle: moveAngle
              }
            }));
          }
        }
        break;
      }
    }
  }
}));
