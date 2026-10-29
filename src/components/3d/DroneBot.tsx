import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useLabStore } from '../../store/useLabStore';
import * as THREE from 'three';

export const DroneBot: React.FC = () => {
  const bot = useLabStore(state => state.bot);
  const botRef = useRef<THREE.Group>(null);
  const rotorsRef = useRef<THREE.Group[]>([]);
  const irBeamRef = useRef<THREE.Mesh>(null);

  // Rotor arm offsets relative to drone center
  const rotorPositions: [number, number, number][] = [
    [0.7, 0.15, 0.7],
    [-0.7, 0.15, 0.7],
    [0.7, 0.15, -0.7],
    [-0.7, 0.15, -0.7],
  ];

  useFrame((state, delta) => {
    // Spin rotor blades
    const spinSpeed = bot.phase === 'SLEEP_BENCH' ? 1.5 : 28.0;
    rotorsRef.current.forEach((r, idx) => {
      if (r) {
        r.rotation.y += (idx % 2 === 0 ? 1 : -1) * spinSpeed * delta;
      }
    });

    // Gentle hovering bob when not dormant
    if (botRef.current) {
      if (bot.phase !== 'SLEEP_BENCH') {
        botRef.current.position.y = bot.position[1] + Math.sin(state.clock.elapsedTime * 4) * 0.08;
      } else {
        botRef.current.position.y = bot.position[1];
      }
      botRef.current.position.x = bot.position[0];
      botRef.current.position.z = bot.position[2];

      // Subtle bank tilt when navigating
      if (bot.phase === 'NAVIGATING') {
        botRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 3) * 0.08;
      } else {
        botRef.current.rotation.z = 0;
      }
    }

    // IR Beam pulsing animation when transmitting
    if (irBeamRef.current) {
      const mat = irBeamRef.current.material as THREE.MeshBasicMaterial;
      if (bot.phase === 'TRANSMITTING_IR') {
        mat.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 25) * 0.35;
      } else {
        mat.opacity = 0;
      }
    }
  });

  return (
    <group ref={botRef} position={bot.position}>
      {/* Light-Emitting Cyan PointLight casting real-time cybernetic illumination */}
      <pointLight 
        color="#00f3ff" 
        intensity={bot.phase === 'SLEEP_BENCH' ? 1.2 : 3.5} 
        distance={10} 
        decay={2} 
      />

      {/* Main Core: Glowing Chrome Sphere Body */}
      <mesh>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial 
          color="#d0e8ff" 
          metalness={0.96} 
          roughness={0.08} 
        />
      </mesh>

      {/* Cybernetic Equator Ring & Neon Trim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.45, 0.03, 16, 64]} />
        <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={1.8} />
      </mesh>

      {/* Forward Optical Sensor / High-Res Camera Lens */}
      <group position={[0, 0, 0.38]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.14, 0.1, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Lens Glass */}
        <mesh position={[0, 0, 0.06]}>
          <sphereGeometry args={[0.09, 24, 24]} />
          <meshStandardMaterial 
            color="#ff0055" 
            emissive={bot.phase === 'ANALYZING_FEED' ? '#ff0055' : '#00f3ff'} 
            emissiveIntensity={bot.phase === 'ANALYZING_FEED' ? 2.5 : 1.0} 
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* 4 Carbon-Fiber Rotor Arms with Ring Rotor Accents */}
      {rotorPositions.map((pos, idx) => (
        <group key={`rotor-arm-${idx}`} position={[0, 0, 0]}>
          {/* Arm strut connecting core to rotor */}
          <line>
            <bufferGeometry 
              attach="geometry"
              {...(() => {
                const geom = new THREE.BufferGeometry();
                const points = new Float32Array([0, 0, 0, pos[0], pos[1], pos[2]]);
                geom.setAttribute('position', new THREE.BufferAttribute(points, 3));
                return geom;
              })()}
            />
            <lineBasicMaterial attach="material" color="#475569" linewidth={3} />
          </line>

          {/* Rotor Mount Nacelle */}
          <mesh position={pos}>
            <cylinderGeometry args={[0.1, 0.1, 0.12, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} />
          </mesh>

          {/* Outer Protective Guard Ring (ringGeometry / torusGeometry) */}
          <mesh position={[pos[0], pos[1] + 0.06, pos[2]]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.32, 0.02, 12, 36]} />
            <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={0.6} />
          </mesh>

          {/* Spinning Rotor Blades */}
          <group 
            ref={el => { if (el) rotorsRef.current[idx] = el; }} 
            position={[pos[0], pos[1] + 0.08, pos[2]]}
          >
            {/* Blade 1 */}
            <mesh>
              <boxGeometry args={[0.56, 0.015, 0.05]} />
              <meshStandardMaterial color="#00f3ff" transparent opacity={0.85} />
            </mesh>
            {/* Blade 2 */}
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.56, 0.015, 0.05]} />
              <meshStandardMaterial color="#00f3ff" transparent opacity={0.85} />
            </mesh>
          </group>
        </group>
      ))}

      {/* Active IR / Laser Emitter Beam when transmitting IR */}
      <mesh ref={irBeamRef} position={[0, -0.1, 2.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.8, 5.0, 16, 1, true]} />
        <meshBasicMaterial 
          color="#ff0055" 
          transparent 
          opacity={0} 
          side={THREE.DoubleSide} 
        />
      </mesh>

      {/* Physical Floating Status Badge floating physically over agent's 3D mesh */}
      <Html position={[0, 0.95, 0]} center distanceFactor={14}>
        <div className="pointer-events-none select-none flex flex-col items-center">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/90 border border-cyan-500/60 shadow-[0_0_15px_rgba(0,243,255,0.4)] backdrop-blur-md text-[11px] font-mono font-semibold text-cyan-300 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
            <span>{bot.name}</span>
            <span className="text-slate-500">|</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
              bot.phase === 'SLEEP_BENCH' ? 'bg-slate-800 text-slate-300' :
              bot.phase === 'TRANSMITTING_IR' ? 'bg-rose-950 text-rose-300 border border-rose-500/40' :
              bot.phase === 'SYSTEM_RESTORED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
              'bg-amber-950 text-amber-300 border border-amber-500/40'
            }`}>
              {bot.phase.replace('_', ' ')}
            </span>
          </div>

          {/* Active Command Step Subtitle */}
          <div className="mt-1 px-2.5 py-0.5 rounded bg-black/80 border border-slate-700/60 text-[10px] text-slate-300 font-mono text-center shadow-lg max-w-[260px] truncate">
            {bot.activeStepLabel}
          </div>

          {/* Little downward arrow pointer */}
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-cyan-500/60 -mt-[1px]" />
        </div>
      </Html>
    </group>
  );
};

