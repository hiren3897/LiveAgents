import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useLabStore } from '../../store/useLabStore';
import * as THREE from 'three';

export const SleepBench: React.FC = () => {
  const homePos = useLabStore(state => state.bot.homePosition);
  const isDocked = useLabStore(state => state.bot.phase === 'SLEEP_BENCH');
  const glowPadRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (glowPadRef.current) {
      const mat = glowPadRef.current.material as THREE.MeshStandardMaterial;
      const pulse = isDocked ? 0.9 + Math.sin(state.clock.elapsedTime * 3) * 0.4 : 0.3;
      mat.emissiveIntensity = pulse;
    }
  });

  return (
    <group position={homePos}>
      {/* Octagonal Heavy Charging Platform */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[1.8, 2.1, 0.1, 8]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Cybernetic Landing Pad Rings */}
      <mesh ref={glowPadRef} position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.4, 32]} />
        <meshStandardMaterial 
          color="#00f3ff" 
          emissive="#00f3ff" 
          emissiveIntensity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Cross Grid Docking Markings */}
      <mesh position={[0, 0.115, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 0.08]} />
        <meshBasicMaterial color="#00f3ff" />
      </mesh>
      <mesh position={[0, 0.115, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[2.2, 0.08]} />
        <meshBasicMaterial color="#00f3ff" />
      </mesh>

      {/* Charging Terminal Pylon */}
      <mesh position={[1.4, 0.8, 0]}>
        <boxGeometry args={[0.3, 1.6, 0.4]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>
      {/* Power Indicator Bar */}
      <mesh position={[1.24, 1.1, 0]}>
        <boxGeometry args={[0.04, 0.6, 0.18]} />
        <meshStandardMaterial 
          color={isDocked ? '#00ff66' : '#00f3ff'} 
          emissive={isDocked ? '#00ff66' : '#00f3ff'} 
          emissiveIntensity={1.5} 
        />
      </mesh>
    </group>
  );
};

