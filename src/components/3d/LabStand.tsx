import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { StandState, TVState } from '../../types';
import { useLabStore } from '../../store/useLabStore';
import * as THREE from 'three';

interface LabStandProps {
  stand: StandState;
}

export const LabStand: React.FC<LabStandProps> = ({ stand }) => {
  const tvs = useLabStore(state => state.tvs);
  const selectedTvId = useLabStore(state => state.selectedTvId);
  const setSelectedTvId = useLabStore(state => state.setSelectedTvId);
  const triggerManualAnomaly = useLabStore(state => state.triggerManualAnomaly);

  // Group TVs on this stand
  const standTvs = stand.tvIds.map(id => tvs[id]).filter(Boolean) as TVState[];

  return (
    <group position={stand.position}>
      {/* Heavy Base Plate */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[1.1, 1.25, 0.16, 24]} />
        <meshStandardMaterial color="#1a202c" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Main Heavy Dark Metallic Support Pole */}
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.14, 0.16, 4.4, 24]} />
        <meshStandardMaterial color="#2d3748" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Top Beacon Sensor on pole */}
      <mesh position={[0, 4.45, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={0.8} />
      </mesh>

      {/* Stand ID Indicator on Base */}
      <group position={[0, 0.2, 0.9]}>
        <mesh rotation={[-Math.PI / 4, 0, 0]}>
          <boxGeometry args={[0.9, 0.25, 0.05]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>

      {/* Crossbar Mounting Brackets at 3 vertical levels */}
      {[1.2, 2.25, 3.3].map((yHeight, idx) => (
        <group key={`bracket-${idx}`} position={[0, yHeight, 0]}>
          {/* Transverse Crossbar */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 1.9, 16]} />
            <meshStandardMaterial color="#1f2937" metalness={0.85} roughness={0.25} />
          </mesh>
        </group>
      ))}

      {/* 6 TV Panels (3 Front Aisle, 3 Back Aisle) */}
      {standTvs.map(tv => (
        <TVPanel 
          key={tv.id} 
          tv={tv} 
          isSelected={selectedTvId === tv.id}
          onSelect={() => setSelectedTvId(tv.id)}
          onDoubleTrigger={() => triggerManualAnomaly(tv.id)}
        />
      ))}
    </group>
  );
};

interface TVPanelProps {
  tv: TVState;
  isSelected: boolean;
  onSelect: () => void;
  onDoubleTrigger: () => void;
}

const TVPanel: React.FC<TVPanelProps> = ({ tv, isSelected, onSelect, onDoubleTrigger }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Position calculation:
  // level 0: y=1.2m, level 1: y=2.25m, level 2: y=3.3m
  const yPos = 1.2 + tv.level * 1.05;
  // Front: +Z (offset 0.28m, rotY = 0)
  // Back: -Z (offset -0.28m, rotY = Math.PI)
  const zOffset = tv.side === 'front' ? 0.3 : -0.3;
  const rotY = tv.side === 'front' ? 0 : Math.PI;

  // Determine dynamic color based on state metrics
  // #00ff66 (Green = Healthy)
  // #ff3333 (Red = Error Status)
  // #ff9900 (Orange = Active Agent Interventions)
  let screenColor = '#00ff66';
  let emissiveColor = '#00ff66';
  let emissiveIntensity = 0.4;

  if (tv.status === 'failing') {
    screenColor = '#ff3333';
    emissiveColor = '#ff3333';
    emissiveIntensity = 1.2;
  } else if (tv.status === 'repairing') {
    screenColor = '#ff9900';
    emissiveColor = '#ff9900';
    emissiveIntensity = 0.9;
  }

  // Pulsing animation for failing or repairing screens
  useFrame((state) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    if (tv.status === 'failing') {
      const pulse = 0.8 + Math.sin(state.clock.elapsedTime * 6) * 0.45;
      mat.emissiveIntensity = pulse;
    } else if (tv.status === 'repairing') {
      const pulse = 0.7 + Math.sin(state.clock.elapsedTime * 9) * 0.3;
      mat.emissiveIntensity = pulse;
    } else {
      mat.emissiveIntensity = isSelected ? 0.7 : 0.35;
    }
  });

  return (
    <group 
      position={[0, yPos, zOffset]} 
      rotation={[0, rotY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        e.nativeEvent.preventDefault();
        onDoubleTrigger();
      }}
    >
      {/* TV Bezel / Chassis (Matte Black Aluminum) */}
      <mesh>
        <boxGeometry args={[1.72, 1.02, 0.07]} />
        <meshStandardMaterial 
          color={isSelected ? '#00f3ff' : '#0c1017'} 
          metalness={0.7} 
          roughness={0.4} 
        />
      </mesh>

      {/* Screen Face Display (Dynamic Hex Color) */}
      <mesh ref={meshRef} position={[0, 0, 0.038]}>
        <boxGeometry args={[1.64, 0.94, 0.015]} />
        <meshStandardMaterial 
          color={screenColor} 
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Status LED diode in bottom bezel */}
      <mesh position={[0.75, -0.47, 0.04]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={2.0} />
      </mesh>

      {/* Selection outline border glow */}
      {isSelected && (
        <lineSegments position={[0, 0, 0.045]}>
          <edgesGeometry args={[new THREE.BoxGeometry(1.74, 1.04, 0.02)]} />
          <lineBasicMaterial color="#00f3ff" linewidth={2} />
        </lineSegments>
      )}
    </group>
  );
};

