import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useLabStore } from '../store/labStore';

export const CreatureBot: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftFootRef = useRef<THREE.Mesh>(null);
  const rightFootRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const antennaBulbRef = useRef<THREE.Mesh>(null);
  const beamGroupRef = useRef<THREE.Group>(null);
  const beamLightRef = useRef<THREE.PointLight>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  // Subscribe to lightweight labels for overhead UI
  const activeStepLabel = useLabStore(state => state.bot.activeStepLabel);
  const botPhase = useLabStore(state => state.bot.phase);
  const botMood = useLabStore(state => state.bot.mood);

  // 60FPS Zero-React-Rerender Loop
  useFrame((state, delta) => {
    // 1. Advance simulation state machine in store without triggering React state loop
    const store = useLabStore.getState();
    store.tickSimulation(delta);

    const { bot, tvs, simSpeed } = store;
    if (!groupRef.current) return;

    // 2. Smooth position and orientation interpolation directly on Three.js transforms
    const curPos = groupRef.current.position;
    curPos.x = bot.currentPos[0];
    curPos.y = bot.currentPos[1];
    curPos.z = bot.currentPos[2];

    // Smoothly slerp/lerp facing rotation
    let angleDiff = bot.targetFacingAngle - groupRef.current.rotation.y;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    groupRef.current.rotation.y += angleDiff * Math.min(1, 10 * delta * simSpeed);

    const t = state.clock.getElapsedTime();
    const currentTv = bot.currentTvId ? tvs[bot.currentTvId] : null;

    // 3. Phase-dependent expressive animations and dynamic head pitch
    if (bot.mood === 'WALKING') {
      // Body upright and waddle
      if (bodyRef.current) {
        bodyRef.current.rotation.z = Math.sin(t * 14 * simSpeed) * 0.12;
        bodyRef.current.position.y = 0.55 + Math.abs(Math.sin(t * 14 * simSpeed)) * 0.06;
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, 0, 8 * delta);
      }
      // Stepping stubby feet
      if (leftFootRef.current && rightFootRef.current) {
        leftFootRef.current.position.y = Math.max(0, Math.sin(t * 14 * simSpeed) * 0.1);
        rightFootRef.current.position.y = Math.max(0, -Math.sin(t * 14 * simSpeed) * 0.1);
      }
      // Reset head tilt
      if (headRef.current) {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, Math.sin(t * 7) * 0.04, 8 * delta);
      }
      // Wide open bright eyes
      if (leftEyeRef.current && rightEyeRef.current) {
        leftEyeRef.current.scale.set(1.0, 1.0, 1.0);
        rightEyeRef.current.scale.set(1.0, 1.0, 1.0);
        leftEyeRef.current.rotation.z = 0;
        rightEyeRef.current.rotation.z = 0;
      }
      // IR Beam hidden
      if (beamGroupRef.current) beamGroupRef.current.visible = false;
      if (beamLightRef.current) beamLightRef.current.intensity = 0;

    } else if (bot.mood === 'SLEEPING') {
      // Dormant breathing bob
      if (bodyRef.current) {
        bodyRef.current.rotation.z = 0;
        bodyRef.current.position.y = 0.52 + Math.sin(t * 2) * 0.02;
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, 0, 8 * delta);
      }
      if (leftFootRef.current && rightFootRef.current) {
        leftFootRef.current.position.y = 0;
        rightFootRef.current.position.y = 0;
      }
      // Head tilted gently downwards
      if (headRef.current) {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0.25, 8 * delta);
      }
      // Eyes as sleepy horizontal slits (- -)
      if (leftEyeRef.current && rightEyeRef.current) {
        leftEyeRef.current.scale.set(1.1, 0.15, 1.0);
        rightEyeRef.current.scale.set(1.1, 0.15, 1.0);
        leftEyeRef.current.rotation.z = 0;
        rightEyeRef.current.rotation.z = 0;
      }
      // IR Beam hidden
      if (beamGroupRef.current) beamGroupRef.current.visible = false;
      if (beamLightRef.current) beamLightRef.current.intensity = 0;

    } else if (bot.mood === 'REPAIRING') {
      // DYNAMIC HEAD & BODY PITCH TO LOOK DIRECTLY AT THE TV (INCLUDING TOP TV!)
      let targetBodyPitch = 0;
      let targetHeadPitch = -0.15;
      let beamDistance = 1.4;

      if (currentTv) {
        // Vertical TV height in LabScene:
        // Slot 0 (bottom): 1.1m
        // Slot 1 (middle): 2.1m
        // Slot 2 (top):    3.1m
        const tvY = 1.1 + currentTv.slot * 1.0;
        const botHeadY = 1.09;
        const deltaY = tvY - botHeadY;
        const horizontalDist = 1.15;

        // Total pitch angle: negative X rotation tilts upward in Three.js
        const fullPitch = -Math.atan2(deltaY, horizontalDist);

        // Distribute pitch between charming torso backward lean and head tilt
        targetBodyPitch = fullPitch * 0.22;
        targetHeadPitch = fullPitch * 0.82;

        // Exact 3D hypotenuse distance to the screen face
        beamDistance = Math.hypot(deltaY, horizontalDist);
      }

      // Smoothly pitch body & head up
      if (bodyRef.current) {
        bodyRef.current.rotation.z = 0;
        bodyRef.current.position.y = 0.55;
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, targetBodyPitch, 10 * delta * simSpeed);
      }
      if (leftFootRef.current && rightFootRef.current) {
        leftFootRef.current.position.y = 0;
        rightFootRef.current.position.y = 0;
      }
      if (headRef.current) {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetHeadPitch, 10 * delta * simSpeed);
      }

      // Determined squinted eyes (> <)
      if (leftEyeRef.current && rightEyeRef.current) {
        leftEyeRef.current.scale.set(1.0, 0.35, 1.0);
        rightEyeRef.current.scale.set(1.0, 0.35, 1.0);
        leftEyeRef.current.rotation.z = 0.38;
        rightEyeRef.current.rotation.z = -0.38;
      }

      // 4. CONICAL BEAM AIMING & RAPID IR STROBE BLINKING
      if (beamGroupRef.current) {
        if (bot.phase === 'SENDING_IR_SIGNAL') {
          // Rapid IR strobe cycle (18-20Hz blinking burst)
          const blinkCycle = Math.sin(t * 36);
          const isBlinkOn = blinkCycle > -0.15; // on 55% of the time, off 45%

          // Scale beam along Z to reach the exact TV screen face
          beamGroupRef.current.scale.set(1, 1, beamDistance);

          if (isBlinkOn) {
            beamGroupRef.current.visible = true;
            if (beamLightRef.current) {
              beamLightRef.current.intensity = 3.5;
            }
            if (antennaBulbRef.current) {
              (antennaBulbRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 4.0;
            }
          } else {
            beamGroupRef.current.visible = false;
            if (beamLightRef.current) {
              beamLightRef.current.intensity = 0;
            }
            if (antennaBulbRef.current) {
              (antennaBulbRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
            }
          }
        } else {
          // Not actively sending IR signal
          beamGroupRef.current.visible = false;
          if (beamLightRef.current) beamLightRef.current.intensity = 0;
          if (antennaBulbRef.current) {
            const idlePulse = 1.0 + Math.sin(t * 8) * 0.4;
            (antennaBulbRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = idlePulse;
          }
        }
      }
    }

    // Chest core glowing status pulse
    if (coreRef.current) {
      const coreMat = coreRef.current.material as THREE.MeshStandardMaterial;
      if (bot.mood === 'REPAIRING') {
        coreMat.color.set('#f59e0b');
        coreMat.emissive.set('#f59e0b');
        coreMat.emissiveIntensity = 1.2 + Math.sin(t * 12) * 0.5;
      } else if (bot.mood === 'SLEEPING') {
        coreMat.color.set('#38bdf8');
        coreMat.emissive.set('#38bdf8');
        coreMat.emissiveIntensity = 0.4 + Math.sin(t * 3) * 0.2;
      } else {
        coreMat.color.set('#10b981');
        coreMat.emissive.set('#10b981');
        coreMat.emissiveIntensity = 0.9 + Math.sin(t * 6) * 0.3;
      }
    }
  });

  return (
    <group ref={groupRef} position={[-8, 0, -7]}>
      {/* Soft Ground Shadow / Ambient Contact */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.6, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>

      {/* Main Chunky Body (Warm Terracotta / Coral Capsule Torso) */}
      <group ref={bodyRef} position={[0, 0.55, 0]}>
        {/* Torso Capsule / Rounded Box */}
        <mesh position={[0, 0, 0]}>
          <capsuleGeometry args={[0.34, 0.38, 16, 24]} />
          <meshStandardMaterial 
            color="#e07a5f" 
            roughness={0.35} 
            metalness={0.15} 
          />
        </mesh>

        {/* Cyber Trim Accent Belt */}
        <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.35, 0.025, 12, 32]} />
          <meshStandardMaterial color="#2d3748" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Glowing Chest Core */}
        <mesh ref={coreRef} position={[0, 0.08, 0.32]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial 
            color="#38bdf8" 
            emissive="#38bdf8" 
            emissiveIntensity={1.0} 
            roughness={0.1} 
          />
        </mesh>

        {/* Little Cute Mechanical Backpack / Power Cell */}
        <mesh position={[0, 0.04, -0.32]}>
          <boxGeometry args={[0.36, 0.34, 0.15]} />
          <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Battery Level Pip on backpack */}
        <mesh position={[0, 0.08, -0.40]}>
          <boxGeometry args={[0.2, 0.05, 0.02]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={1.4} />
        </mesh>

        {/* Cute Chunky Arms */}
        <mesh position={[0.42, 0.02, 0]} rotation={[0, 0, -0.2]}>
          <capsuleGeometry args={[0.09, 0.22, 12, 16]} />
          <meshStandardMaterial color="#e07a5f" roughness={0.4} />
        </mesh>
        <mesh position={[-0.42, 0.02, 0]} rotation={[0, 0, 0.2]}>
          <capsuleGeometry args={[0.09, 0.22, 12, 16]} />
          <meshStandardMaterial color="#e07a5f" roughness={0.4} />
        </mesh>

        {/* Slightly Oversized Rounded Head */}
        <group ref={headRef} position={[0, 0.54, 0.02]}>
          {/* Head Shell */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.36, 24, 24]} />
            <meshStandardMaterial 
              color="#f4a261" 
              roughness={0.3} 
              metalness={0.1} 
            />
          </mesh>

          {/* Dark Glass Visor */}
          <mesh position={[0, 0.02, 0.22]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.26, 0.28, 0.22, 24, 1, false, -Math.PI / 2, Math.PI]} />
            <meshStandardMaterial 
              color="#090d16" 
              roughness={0.1} 
              metalness={0.8} 
            />
          </mesh>

          {/* Twin Expressive Glowing Eyes */}
          <mesh ref={leftEyeRef} position={[-0.11, 0.03, 0.34]}>
            <boxGeometry args={[0.08, 0.08, 0.02]} />
            <meshStandardMaterial 
              color="#38bdf8" 
              emissive="#38bdf8" 
              emissiveIntensity={2.5} 
            />
          </mesh>

          <mesh ref={rightEyeRef} position={[0.11, 0.03, 0.34]}>
            <boxGeometry args={[0.08, 0.08, 0.02]} />
            <meshStandardMaterial 
              color="#38bdf8" 
              emissive="#38bdf8" 
              emissiveIntensity={2.5} 
            />
          </mesh>

          {/* Head Antenna with Glowing Cyan Bulb */}
          <group position={[0, 0.36, 0]}>
            {/* Antenna stalk */}
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.02, 0.025, 0.2, 12]} />
              <meshStandardMaterial color="#374151" metalness={0.9} />
            </mesh>
            {/* Antenna Bulb */}
            <mesh ref={antennaBulbRef} position={[0, 0.22, 0]}>
              <sphereGeometry args={[0.065, 16, 16]} />
              <meshStandardMaterial 
                color="#00f3ff" 
                emissive="#00f3ff" 
                emissiveIntensity={1.8} 
              />
            </mesh>
            {/* Soft point light on antenna */}
            <pointLight color="#00f3ff" intensity={1.5} distance={3} decay={2} position={[0, 0.22, 0]} />
          </group>

          {/* ----------------------------------------------------------- */}
          {/* HIGH-TECH DYNAMIC CONICAL IR BEAM (BLINKS & AIMS DIRECTLY) */}
          {/* ----------------------------------------------------------- */}
          <group ref={beamGroupRef} position={[0, 0.22, 0.2]} visible={false}>
            {/* 1. Outer Expanding Conical Beam Shroud */}
            <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.38, 0.03, 1.0, 24, 1, true]} />
              <meshBasicMaterial 
                color="#38bdf8" 
                transparent 
                opacity={0.45} 
                side={THREE.DoubleSide} 
                depthWrite={false}
              />
            </mesh>

            {/* 2. Intense Core Laser Line */}
            <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.09, 0.015, 1.0, 16, 1, false]} />
              <meshBasicMaterial 
                color="#e0f2fe" 
                transparent 
                opacity={0.85} 
                side={THREE.DoubleSide} 
                depthWrite={false}
              />
            </mesh>

            {/* 3. Wavefront Beam Pulse Rings */}
            <mesh position={[0, 0, 0.33]}>
              <ringGeometry args={[0.08, 0.14, 20]} />
              <meshBasicMaterial color="#00f3ff" transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <mesh position={[0, 0, 0.66]}>
              <ringGeometry args={[0.18, 0.26, 24]} />
              <meshBasicMaterial color="#00f3ff" transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>

            {/* 4. Impact Reticle Target Ring on the TV Screen Face */}
            <mesh position={[0, 0, 1.0]}>
              <ringGeometry args={[0.16, 0.34, 24]} />
              <meshBasicMaterial color="#f59e0b" transparent opacity={0.9} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0, 1.0]}>
              <circleGeometry args={[0.1, 16]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.95} side={THREE.DoubleSide} />
            </mesh>

            {/* 5. Synchronized Blinking Point Light Casting onto Screen */}
            <pointLight ref={beamLightRef} color="#38bdf8" intensity={3.5} distance={5} decay={2} position={[0, 0, 1.0]} />
          </group>
        </group>
      </group>

      {/* Two Stubby Stepping Feet */}
      <mesh ref={leftFootRef} position={[-0.18, 0.08, 0]}>
        <boxGeometry args={[0.16, 0.12, 0.28]} />
        <meshStandardMaterial color="#264653" roughness={0.5} />
      </mesh>
      <mesh ref={rightFootRef} position={[0.18, 0.08, 0]}>
        <boxGeometry args={[0.16, 0.12, 0.28]} />
        <meshStandardMaterial color="#264653" roughness={0.5} />
      </mesh>

      {/* Floating Animated "Zzz" when Sleeping */}
      {botMood === 'SLEEPING' && (
        <Html position={[0.35, 1.6, 0]} center distanceFactor={8}>
          <div className="pointer-events-none select-none text-cyan-300 font-bold font-mono text-xs animate-bounce tracking-widest bg-black/60 px-2 py-0.5 rounded-full border border-cyan-500/40 backdrop-blur-sm shadow-[0_0_10px_rgba(0,243,255,0.4)]">
            Zzz...
          </div>
        </Html>
      )}

      {/* Non-Jittery Floating Overhead Status Pill */}
      <Html position={[0, 2.2, 0]} center distanceFactor={10}>
        <div className="pointer-events-none select-none flex flex-col items-center">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/90 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,243,255,0.3)] backdrop-blur-md text-[11px] font-mono font-semibold text-slate-100 whitespace-nowrap">
            <span className={`w-2 h-2 rounded-full inline-block ${
              botMood === 'SLEEPING' ? 'bg-slate-400' :
              botMood === 'REPAIRING' ? 'bg-amber-400 animate-ping' :
              'bg-emerald-400 animate-pulse'
            }`} />
            <span>{activeStepLabel}</span>
          </div>
          {/* Arrow Pointer */}
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-cyan-500/50" />
        </div>
      </Html>
    </group>
  );
};
