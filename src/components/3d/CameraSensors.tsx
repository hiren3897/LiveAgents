import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useLabStore } from '../../store/useLabStore';
import * as THREE from 'three';

export const CameraSensors: React.FC = () => {
  const cameras = useLabStore(state => state.cameras);
  const bot = useLabStore(state => state.bot);
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef}>
      {cameras.map((cam, idx) => (
        <AisleCameraItem key={cam.id} cam={cam} idx={idx} isBotNearby={
          Math.hypot(bot.position[0] - cam.position[0], bot.position[2] - cam.position[2]) < 5
        } />
      ))}
    </group>
  );
};

interface AisleCameraItemProps {
  cam: {
    id: string;
    position: [number, number, number];
    aisleIndex: number;
  };
  idx: number;
  isBotNearby: boolean;
}

const AisleCameraItem: React.FC<AisleCameraItemProps> = ({ cam, isBotNearby }) => {
  const sphereRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (sphereRef.current) {
      const mat = sphereRef.current.material as THREE.MeshStandardMaterial;
      const pulseRate = isBotNearby ? 8 : 2;
      const emissive = 1.2 + Math.sin(state.clock.elapsedTime * pulseRate) * 0.4;
      mat.emissiveIntensity = emissive;
    }
  });

  return (
    <group position={cam.position}>
      {/* Ceiling / Overhead Truss Mount */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 12]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>

      {/* Camera Gimbal Turret */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.14, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Glowing Yellow Sphere Sensor (Emissive #ffcc00) */}
      <mesh ref={sphereRef} position={[0, -0.15, 0]}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial 
          color="#ffcc00" 
          emissive="#ffcc00" 
          emissiveIntensity={1.4}
          roughness={0.15}
          metalness={0.4}
        />
      </mesh>

      {/* Point Light casting yellow security lighting */}
      <pointLight 
        ref={lightRef}
        position={[0, -0.2, 0]} 
        color="#ffcc00" 
        intensity={isBotNearby ? 1.8 : 0.8} 
        distance={6} 
        decay={2}
      />

      {/* Camera Sensor Ring */}
      <mesh position={[0, -0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.26, 0.02, 12, 32]} />
        <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
};

