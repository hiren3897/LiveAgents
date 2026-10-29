import { useLabStore } from '../store/useLabStore';
import { BotPhase, TVState, StandState } from '../types';

class BackendOrchestratorEngine {
  private timer: number | null = null;
  private anomalyTimer: number | null = null;
  private isProcessing = false;
  private currentRepairStepStartTime = 0;
  private currentStepDuration = 0;

  public start() {
    if (this.timer) return;
    
    // Main Orchestrator state loop running at 20Hz (every 50ms)
    this.timer = window.setInterval(() => {
      this.tick();
    }, 50);

    // Periodic autonomous anomaly injector
    this.anomalyTimer = window.setInterval(() => {
      this.checkAutonomousAnomaly();
    }, 9000);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.anomalyTimer) {
      clearInterval(this.anomalyTimer);
      this.anomalyTimer = null;
    }
  }

  private checkAutonomousAnomaly() {
    const store = useLabStore.getState();
    if (!store.hardwareConfig.isSimulationRunning) return;

    const failingCount = Object.values(store.tvs).filter(t => t.status === 'failing' || t.status === 'repairing').length;
    // Keep 1-3 failing TVs in active rotation for exciting live demo
    if (failingCount < 2) {
      store.triggerManualAnomaly();
    }
  }

  private tick() {
    const store = useLabStore.getState();
    const { bot, tvs, stands, hardwareConfig } = store;

    // Check if bot is idle at sleep bench and there is a failing TV
    if (bot.phase === 'SLEEP_BENCH') {
      const failingTvs = Object.values(tvs).filter(t => t.status === 'failing');
      if (failingTvs.length > 0) {
        const nextTv = failingTvs[0];
        const targetStand = stands[nextTv.standId];
        if (targetStand) {
          this.dispatchBotToTv(nextTv, targetStand);
        }
      }
      return;
    }

    // Process active repair phases
    this.processActiveBotPhase(store);
  }

  private dispatchBotToTv(tv: TVState, stand: StandState) {
    const store = useLabStore.getState();
    
    // Calculate 3D target coordinates for the drone to hover in front of the TV
    // Stand position: [x, 0, z]
    // TV level: 0: 1.2m, 1: 2.2m, 2: 3.2m
    const tvHeight = 1.2 + tv.level * 1.05;
    // Front aisle faces +Z offset (+1.8m hover dist); Back aisle faces -Z offset (-1.8m hover dist)
    const zOffset = tv.side === 'front' ? 2.0 : -2.0;
    const targetPos: [number, number, number] = [
      stand.position[0],
      tvHeight,
      stand.position[2] + zOffset
    ];

    store.updateBot({
      phase: 'NAVIGATING',
      targetStandId: stand.id,
      currentTvId: tv.id,
      targetPosition: targetPos,
      phaseProgress: 0,
      activeStepLabel: `Deploying drone -> Stand ${stand.id} (${tv.side.toUpperCase()} Panel #${tv.id})`,
      retryAttempts: 0
    });

    store.updateTV(tv.id, { status: 'repairing' });
    store.setSelectedTvId(tv.id);
    store.setCameraMode('FOLLOW_BOT', stand.position);

    // Agent conversation: Orchestrator instructs Repair Agent
    store.addLogMessage({
      sender: 'BACKEND_ORCHESTRATOR',
      recipient: 'REPAIR_AGENT',
      severity: 'HIGH',
      error_signature: 'TASK_DISPATCH_BOT_01',
      assigned_priority: 'P1',
      tvId: tv.id,
      standId: stand.id,
      message: `Work Order Dispatched: Drone assigned to ${tv.id} at ${stand.id}. Moving to coordinates [${targetPos[0].toFixed(1)}, ${targetPos[1].toFixed(1)}, ${targetPos[2].toFixed(1)}].`,
      metadata: {
        error: tv.errorType,
        estimatedFlightTimeMs: 2400,
        opticalAlignmentRequired: true
      }
    });

    this.currentRepairStepStartTime = Date.now();
    this.currentStepDuration = 2400; // 2.4s navigation
  }

  private processActiveBotPhase(store: ReturnType<typeof useLabStore.getState>) {
    const { bot, tvs, stands, hardwareConfig } = store;
    const now = Date.now();
    const elapsed = now - this.currentRepairStepStartTime;
    const currentTv = bot.currentTvId ? tvs[bot.currentTvId] : null;

    if (!currentTv) {
      this.returnBotToHome();
      return;
    }

    const progress = Math.min(100, Math.floor((elapsed / this.currentStepDuration) * 100));

    // Smoothly interpolate drone position towards targetPosition
    const curPos = [...bot.position] as [number, number, number];
    const tgtPos = bot.targetPosition;
    const lerpFactor = 0.08;
    curPos[0] += (tgtPos[0] - curPos[0]) * lerpFactor;
    curPos[1] += (tgtPos[1] - curPos[1]) * lerpFactor;
    curPos[2] += (tgtPos[2] - curPos[2]) * lerpFactor;

    store.updateBot({
      position: curPos,
      phaseProgress: progress
    });

    if (progress < 100) return;

    // Phase transitions
    switch (bot.phase) {
      case 'NAVIGATING': {
        // Transition to ANALYZING_FEED
        store.updateBot({
          phase: 'ANALYZING_FEED',
          phaseProgress: 0,
          activeStepLabel: `Analyzing optical video stream on ${currentTv.id} via Aisle Camera Array...`
        });

        store.addLogMessage({
          sender: 'REPAIR_AGENT',
          recipient: 'TEST_AGENT',
          severity: 'MEDIUM',
          error_signature: 'FEED_ACQUISITION_LOCK',
          assigned_priority: 'P2',
          tvId: currentTv.id,
          standId: currentTv.standId,
          message: `Arrived on-station at ${currentTv.id}. Optical alignment locked. Reading frame buffer raster.`,
          metadata: {
            detectedFault: currentTv.errorType,
            ambientAisleTemp: '24.2°C',
            opticalConfidence: '99.4%'
          }
        });

        this.currentRepairStepStartTime = Date.now();
        this.currentStepDuration = 1800;
        break;
      }

      case 'ANALYZING_FEED': {
        // Simulate hardware trait: IR Packet Drop chance
        const hasPacketDrop = Math.random() < hardwareConfig.packetDropRate;
        
        if (hasPacketDrop && bot.retryAttempts === 0) {
          // Packet dropped! Trigger retry
          store.updateBot({
            retryAttempts: bot.retryAttempts + 1,
            phaseProgress: 20,
            activeStepLabel: `[PACKET LOSS] IR burst ACK dropped by interference! Resending packet...`
          });

          store.addLogMessage({
            sender: 'REPAIR_AGENT',
            recipient: 'BACKEND_ORCHESTRATOR',
            severity: 'HIGH',
            error_signature: 'IR_PACKET_DROP_ERR',
            assigned_priority: 'P1',
            tvId: currentTv.id,
            standId: currentTv.standId,
            message: `Physical simulation triggered: IR command packet dropped over 433MHz carrier. Retrying with preamble sync...`,
            metadata: {
              packetDropRateSetting: `${(hardwareConfig.packetDropRate * 100).toFixed(1)}%`,
              retryCount: bot.retryAttempts + 1,
              carrierFrequency: '433.92MHz'
            }
          });

          this.currentRepairStepStartTime = Date.now();
          this.currentStepDuration = 1200; // Extra retry delay
          return;
        }

        // Transition to TRANSMITTING_IR
        store.updateBot({
          phase: 'TRANSMITTING_IR',
          phaseProgress: 0,
          activeStepLabel: `Transmitting IR flashing array sequence (${currentTv.errorType})...`
        });

        store.addLogMessage({
          sender: 'REPAIR_AGENT',
          recipient: 'TEST_AGENT',
          severity: 'LOW',
          error_signature: 'IR_FLASH_SEQUENCE_TX',
          assigned_priority: 'P2',
          tvId: currentTv.id,
          standId: currentTv.standId,
          message: `Transmitting high-intensity IR hex command string: [0xAA, 0x55, 0x12, 0xF8]. Propagation delay ${hardwareConfig.propagationDelayMs}ms.`,
          metadata: {
            hexPayload: 'AA5512F89C002B',
            propagationDelay: `${hardwareConfig.propagationDelayMs}ms`
          }
        });

        this.currentRepairStepStartTime = Date.now();
        // Variable repair time based on error type
        let duration = 2200;
        if (currentTv.errorType === 'POWER_CYCLE_FAILURE') duration = 3800;
        else if (currentTv.errorType === 'EDID_CORRUPTION') duration = 3000;
        else if (currentTv.errorType === 'HDMI_HANDSHAKE_LOSS') duration = 2400;
        else if (currentTv.errorType === 'SIGNAL_DESYNC') duration = 1600;

        this.currentStepDuration = duration;
        break;
      }

      case 'TRANSMITTING_IR': {
        // Transition to VERIFYING_SYNC
        store.updateBot({
          phase: 'VERIFYING_SYNC',
          phaseProgress: 0,
          activeStepLabel: `Verifying HDMI TMDS clock & video signal sync...`
        });

        store.addLogMessage({
          sender: 'TEST_AGENT',
          recipient: 'REPAIR_AGENT',
          severity: 'LOW',
          error_signature: 'SYNC_HANDSHAKE_POLL',
          assigned_priority: 'P3',
          tvId: currentTv.id,
          standId: currentTv.standId,
          message: `Testing video clock lock on ${currentTv.id}. Verifying EDID 1080p@60Hz RGB stream integrity.`,
          metadata: {
            handshakeStage: 'TMDS_LOCKED',
            signalJitter: '0.04ns'
          }
        });

        this.currentRepairStepStartTime = Date.now();
        this.currentStepDuration = 1800;
        break;
      }

      case 'VERIFYING_SYNC': {
        // Transition to SYSTEM_RESTORED
        store.updateTV(currentTv.id, {
          status: 'healthy',
          errorType: undefined,
          signalStrength: 99,
          latencyMs: 11,
          temperatureC: 39
        });

        store.updateBot({
          phase: 'SYSTEM_RESTORED',
          phaseProgress: 100,
          activeStepLabel: `Restoration Verified: ${currentTv.id} is HEALTHY!`,
          lastRepairedTvId: currentTv.id
        });

        store.addLogMessage({
          sender: 'TEST_AGENT',
          recipient: 'ALL',
          severity: 'LOW',
          error_signature: 'RESTORE_SUCCESS_200_OK',
          assigned_priority: 'P3',
          tvId: currentTv.id,
          standId: currentTv.standId,
          message: `Verification SUCCESS: TV ${currentTv.id} is fully restored to 100% nominal. HDMI clock synchronized, frame rate steady at 60.0 FPS.`,
          metadata: {
            finalLatency: '11ms',
            signalQuality: '100%',
            resolution: '1920x1080'
          }
        });

        this.currentRepairStepStartTime = Date.now();
        this.currentStepDuration = 1400;
        break;
      }

      case 'SYSTEM_RESTORED': {
        // Check if there are other failing TVs
        const remainingFailing = Object.values(tvs).filter(t => t.status === 'failing' && t.id !== currentTv.id);
        if (remainingFailing.length > 0) {
          const nextTv = remainingFailing[0];
          const targetStand = stands[nextTv.standId];
          if (targetStand) {
            this.dispatchBotToTv(nextTv, targetStand);
            return;
          }
        }

        // No more failing TVs, return home to sleep bench!
        this.returnBotToHome();
        break;
      }
    }
  }

  private returnBotToHome() {
    const store = useLabStore.getState();
    const home = store.bot.homePosition;

    store.updateBot({
      phase: 'SLEEP_BENCH',
      currentStandId: null,
      currentTvId: null,
      targetPosition: [...home],
      phaseProgress: 100,
      activeStepLabel: 'Standby at Sleep Bench. Lab displays 100% operational.'
    });

    store.setCameraMode('ORBIT_ROOM');

    store.addLogMessage({
      sender: 'REPAIR_AGENT',
      recipient: 'BACKEND_ORCHESTRATOR',
      severity: 'LOW',
      error_signature: 'BOT_RETURN_HOME_DOCK',
      assigned_priority: 'P3',
      message: 'Maintenance mission completed. Drone docked at Sleep Bench. Ready for next telemetry alert.'
    });
  }
}

export const orchestrator = new BackendOrchestratorEngine();

