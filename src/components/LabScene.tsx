import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import * as THREE from 'three';
import { useLabStore, DESK_POSITION } from '../store/labStore';
import { StandData, TVItem, OverheadCamera } from '../types';
import { CreatureBot } from './CreatureBot';

// ---------------------------------------------------------------------
// Single Camera Controller with Smooth State-Driven Transitions
// ---------------------------------------------------------------------
const SceneCameraController: React.FC = () => {
  const cameraControlsRef = useRef<CameraControls>(null);
  const cameraMode = useLabStore(state => state.cameraMode);
  const botPhase = useLabStore(state => state.bot.phase);
  const targetStandId = useLabStore(state => state.bot.targetStandId);
  const stands = useLabStore(state => state.stands);

  // Transition camera when bot phase changes in AUTO_FOLLOW mode
  useEffect(() => {
    if (!cameraControlsRef.current || cameraMode !== 'AUTO_FOLLOW') return;

    if (botPhase === 'SLEEPING') {
      // Cinematic isometric overview of the 70-display laboratory
      cameraControlsRef.current.setLookAt(13.5, 12.5, 13.5, 0, 1.2, 0, true);
    } else if (targetStandId && stands[targetStandId]) {
      const stand = stands[targetStandId];
      // Smoothly frame the active stand and creature-bot
      cameraControlsRef.current.setLookAt(
        stand.position[0] + 3.2,
        2.6,
        stand.position[2] + 3.4,
        stand.position[0],
        1.6,
        stand.position[2],
        true
      );
    }
  }, [botPhase, targetStandId, cameraMode, stands]);

  return (
    <CameraControls 
      ref={cameraControlsRef} 
      makeDefault 
      minDistance={2.5}
      maxDistance={40}
      maxPolarAngle={Math.PI / 2 - 0.05} // Keep above floor
      smoothTime={0.4}
    />
  );
};

// ---------------------------------------------------------------------
// Individual TV Monitor Mesh with Emissive States & Test Pattern
// ---------------------------------------------------------------------
interface TVMonitorProps {
  tv: TVItem;
  isSelected: boolean;
  onSelect: () => void;
  onTriggerFault: () => void;
}

const TVMonitor: React.FC<TVMonitorProps> = ({ tv, isSelected, onSelect, onTriggerFault }) => {
  const screenMeshRef = useRef<THREE.Mesh>(null);

  // Vertical placement: slots 0 (bottom 1.1m), 1 (mid 2.1m), 2 (top 3.1m)
  const yPos = 1.1 + tv.slot * 1.0;
  const zPos = tv.side === 'front' ? 0.28 : -0.28;
  const rotY = tv.side === 'front' ? 0 : Math.PI;

  let screenColor = '#10b981'; // HEALTHY Emerald
  let emissiveIntensity = 0.45;

  if (tv.status === 'BROKEN') {
    screenColor = '#ef4444'; // BROKEN Crimson
    emissiveIntensity = 1.2;
  } else if (tv.status === 'REPAIRING') {
    screenColor = '#f59e0b'; // REPAIRING Amber
    emissiveIntensity = 0.9;
  }

  // Soft pulsing animation on broken or repairing screens
  useFrame((state) => {
    if (!screenMeshRef.current) return;
    const mat = screenMeshRef.current.material as THREE.MeshStandardMaterial;

    if (tv.status === 'BROKEN') {
      const pulse = 0.8 + Math.sin(state.clock.elapsedTime * 8) * 0.45;
      mat.emissiveIntensity = pulse;
    } else if (tv.status === 'REPAIRING') {
      const pulse = 0.7 + Math.sin(state.clock.elapsedTime * 12) * 0.35;
      mat.emissiveIntensity = pulse;
    } else {
      mat.emissiveIntensity = isSelected ? 0.75 : 0.35;
    }
  });

  return (
    <group 
      position={[0, yPos, zPos]} 
      rotation={[0, rotY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onTriggerFault();
      }}
    >
      {/* Matte Dark Bezel / Chassis */}
      <mesh>
        <boxGeometry args={[1.56, 0.92, 0.06]} />
        <meshStandardMaterial 
          color={isSelected ? '#38bdf8' : '#0a0e17'} 
          metalness={0.8} 
          roughness={0.3} 
        />
      </mesh>

      {/* Screen Display Face */}
      <mesh ref={screenMeshRef} position={[0, 0, 0.032]}>
        <boxGeometry args={[1.48, 0.84, 0.01]} />
        <meshStandardMaterial 
          color={screenColor} 
          emissive={screenColor} 
          emissiveIntensity={emissiveIntensity} 
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Power / Sync Status LED */}
      <mesh position={[0.68, -0.41, 0.035]}>
        <sphereGeometry args={[0.016, 8, 8]} />
        <meshStandardMaterial 
          color={screenColor} 
          emissive={screenColor} 
          emissiveIntensity={2.5} 
        />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------------
// Floor Stand Component (Support Pole, Base Plate & Mounted TVs)
// ---------------------------------------------------------------------
interface TVStandProps {
  stand: StandData;
}

const TVStand: React.FC<TVStandProps> = ({ stand }) => {
  const tvs = useLabStore(state => state.tvs);
  const selectedTvId = useLabStore(state => state.selectedTvId);
  const setSelectedTvId = useLabStore(state => state.setSelectedTvId);
  const triggerManualFailure = useLabStore(state => state.triggerManualFailure);

  const standTvs = stand.tvIds.map(id => tvs[id]).filter(Boolean);

  return (
    <group position={stand.position}>
      {/* Heavy Cylindrical Floor Base Plate */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.9, 1.05, 0.12, 24]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Central Brushed-Metal Vertical Support Pole */}
      <mesh position={[0, 2.1, 0]}>
        <cylinderGeometry args={[0.11, 0.13, 4.2, 24]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Top Beacon Pylon Cap */}
      <mesh position={[0, 4.24, 0]}>
        <cylinderGeometry args={[0.08, 0.11, 0.12, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} />
      </mesh>
      <mesh position={[0, 4.32, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
      </mesh>

      {/* Horizontal Crossbars for TV Mounts */}
      {[1.1, 2.1, 3.1].map((h, i) => (
        <mesh key={`bar-${i}`} position={[0, h, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 1.4, 12]} />
          <meshStandardMaterial color="#1f2937" metalness={0.85} />
        </mesh>
      ))}

      {/* Mounted TVs (Front and Back) */}
      {standTvs.map(tv => (
        <TVMonitor 
          key={tv.id} 
          tv={tv} 
          isSelected={selectedTvId === tv.id}
          onSelect={() => setSelectedTvId(tv.id)}
          onTriggerFault={() => triggerManualFailure(tv.id)}
        />
      ))}
    </group>
  );
};

// ---------------------------------------------------------------------
// Overhead / Aisle Surveillance Camera Pods (8 Total)
// ---------------------------------------------------------------------
interface OverheadCameraPodProps {
  camera: OverheadCamera;
}

const OverheadCameraPod: React.FC<OverheadCameraPodProps> = ({ camera }) => {
  const targetTv = useLabStore(state => {
    const selId = state.selectedTvId;
    return selId ? state.tvs[selId] : null;
  });

  const isInspectingThisRow = targetTv?.row === camera.row && (targetTv?.status === 'BROKEN' || targetTv?.status === 'REPAIRING');

  return (
    <group position={camera.position}>
      {/* Ceiling Mount Bracket */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.5, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>

      {/* Gimbal Turret */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Glowing Yellow Camera Pod Lens */}
      <mesh position={[0, -0.1, 0]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial 
          color="#ffcc00" 
          emissive="#ffcc00" 
          emissiveIntensity={isInspectingThisRow ? 2.2 : 1.2} 
        />
      </mesh>

      {/* Target Aiming Light */}
      <pointLight 
        color="#ffcc00" 
        intensity={isInspectingThisRow ? 2.5 : 0.8} 
        distance={6} 
        decay={2} 
        position={[0, -0.15, 0]}
      />
    </group>
  );
};

// ---------------------------------------------------------------------
// Cozy Bot Maintenance Desk & Charging Pad at [-8, 0, -7]
// ---------------------------------------------------------------------
const MaintenanceDesk: React.FC = () => {
  const isSleeping = useLabStore(state => state.bot.phase === 'SLEEPING');

  return (
    <group position={DESK_POSITION}>
      {/* Glowing Octagonal Charging Pad */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[1.1, 1.25, 0.04, 8]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Pulsing Charging Ring */}
      <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 1.0, 32]} />
        <meshStandardMaterial 
          color={isSleeping ? '#10b981' : '#38bdf8'} 
          emissive={isSleeping ? '#10b981' : '#38bdf8'} 
          emissiveIntensity={isSleeping ? 1.4 : 0.6} 
          side={THREE.DoubleSide} 
        />
      </mesh>

      {/* Workstation Desk Table */}
      <group position={[0, 0, -1.35]}>
        {/* Table Top */}
        <mesh position={[0, 0.85, 0]}>
          <boxGeometry args={[1.8, 0.08, 0.8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* Desk Metal Legs */}
        <mesh position={[-0.8, 0.42, -0.3]}>
          <cylinderGeometry args={[0.03, 0.03, 0.84, 8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
        <mesh position={[0.8, 0.42, -0.3]}>
          <cylinderGeometry args={[0.03, 0.03, 0.84, 8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
        <mesh position={[-0.8, 0.42, 0.3]}>
          <cylinderGeometry args={[0.03, 0.03, 0.84, 8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
        <mesh position={[0.8, 0.42, 0.3]}>
          <cylinderGeometry args={[0.03, 0.03, 0.84, 8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>

        {/* Tiny Cyber-Terminal Monitor on desk */}
        <group position={[0, 0.94, -0.05]} rotation={[0, 0, 0]}>
          {/* Base */}
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.12, 0.14, 0.04, 12]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.24, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.9} />
          </mesh>
          {/* Monitor Screen */}
          <mesh position={[0, 0.34, 0]}>
            <boxGeometry args={[0.62, 0.38, 0.04]} />
            <meshStandardMaterial color="#090d16" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.34, 0.022]}>
            <boxGeometry args={[0.56, 0.32, 0.005]} />
            <meshStandardMaterial 
              color="#10b981" 
              emissive="#10b981" 
              emissiveIntensity={1.2} 
            />
          </mesh>
        </group>

        {/* Recharging Station Cable Pylon */}
        <mesh position={[-0.65, 1.25, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.8, 12]} />
          <meshStandardMaterial color="#2d3748" metalness={0.8} />
        </mesh>
        <mesh position={[-0.65, 1.68, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial 
            color={isSleeping ? '#10b981' : '#38bdf8'} 
            emissive={isSleeping ? '#10b981' : '#38bdf8'} 
            emissiveIntensity={1.8} 
          />
        </mesh>
      </group>
    </group>
  );
};

// ---------------------------------------------------------------------
// Full 3D Lab Scene
// ---------------------------------------------------------------------
export const LabScene: React.FC = () => {
  const stands = useLabStore(state => state.stands);
  const cameras = useLabStore(state => state.cameras);

  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        camera={{ position: [14, 12, 14], fov: 42 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#070b14']} />
        <fog attach="fog" args={['#070b14', 24, 60]} />

        {/* Studio Lighting */}
        <ambientLight intensity={0.65} />
        <directionalLight 
          position={[12, 22, 14]} 
          intensity={1.1} 
          color="#f1f5f9" 
        />
        <directionalLight 
          position={[-14, 12, -12]} 
          intensity={0.5} 
          color="#38bdf8" 
        />
        <pointLight position={[0, 9, 0]} intensity={1.2} color="#00f3ff" distance={35} />

        {/* Industrial Lab Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[42, 38]} />
          <meshStandardMaterial 
            color="#0b1120" 
            metalness={0.7} 
            roughness={0.4} 
          />
        </mesh>

        {/* Clean Floor Grid Overlay */}
        <gridHelper 
          args={[42, 28, '#1e293b', '#0f172a']} 
          position={[0, 0.005, 0]} 
        />

        {/* 12 Floor Stands (Holding 70 TVs) */}
        {Object.values(stands).map(stand => (
          <TVStand key={stand.id} stand={stand} />
        ))}

        {/* 8 Overhead Surveillance Camera Pods */}
        {cameras.map(cam => (
          <OverheadCameraPod key={cam.id} camera={cam} />
        ))}

        {/* Bot Maintenance Desk & Charging Pad */}
        <MaintenanceDesk />

        {/* Procedural Micro-Creature Repair Bot */}
        <CreatureBot />

        {/* Anti-Glitch Single Camera Controls */}
        <SceneCameraController />
      </Canvas>
    </div>
  );
};
