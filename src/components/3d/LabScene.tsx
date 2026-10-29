import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useLabStore } from '../../store/useLabStore';
import { LabStand } from './LabStand';
import { DroneBot } from './DroneBot';
import { CameraSensors } from './CameraSensors';
import { SleepBench } from './SleepBench';
import { CameraController } from './CameraController';

export const LabScene: React.FC = () => {
  const stands = useLabStore(state => state.stands);
  const dimensions = useLabStore(state => state.dimensions);

  // Compute floor plane size based on dimensions
  const floorWidth = Math.max(40, (dimensions.cols + 2) * dimensions.standSpacingX);
  const floorDepth = Math.max(35, (dimensions.rows + 2) * dimensions.standSpacingZ);

  return (
    <div className="relative w-full h-full bg-[#050811] overflow-hidden select-none">
      <Canvas
        camera={{ position: [20, 16, 22], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#060a14']} />
        <fog attach="fog" args={['#060a14', 28, 65]} />

        {/* Cyberpunk & Industrial Lighting */}
        <ambientLight intensity={0.55} />
        <directionalLight 
          position={[15, 25, 12]} 
          intensity={1.2} 
          color="#e2e8f0" 
        />
        <directionalLight 
          position={[-15, 12, -15]} 
          intensity={0.6} 
          color="#00f3ff" 
        />
        <pointLight position={[0, 10, 0]} intensity={1.5} color="#38bdf8" distance={40} />

        {/* Industrial Grid Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[floorWidth, floorDepth]} />
          <meshStandardMaterial 
            color="#0b1120" 
            metalness={0.7} 
            roughness={0.4} 
          />
        </mesh>

        {/* Subtle 3D Grid Overlay */}
        <gridHelper 
          args={[floorWidth, Math.round(floorWidth / 1.5), '#1e293b', '#0f172a']} 
          position={[0, 0.005, 0]} 
        />

        <Suspense fallback={null}>
          {/* Floor Stands & 70+ TV Matrix */}
          {Object.values(stands).map(stand => (
            <LabStand key={stand.id} stand={stand} />
          ))}

          {/* Glowing Yellow Aisle Cameras */}
          <CameraSensors />

          {/* Sleep Bench Recharging Station */}
          <SleepBench />

          {/* Procedural Autonomous Drone Bot */}
          <DroneBot />

          {/* Smooth Camera Controller */}
          <CameraController />
        </Suspense>
      </Canvas>
    </div>
  );
};

