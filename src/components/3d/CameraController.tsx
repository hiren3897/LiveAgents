import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useLabStore } from '../../store/useLabStore';
import * as THREE from 'three';

export const CameraController: React.FC = () => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const bot = useLabStore(state => state.bot);
  const stands = useLabStore(state => state.stands);
  const cameraMode = useLabStore(state => state.cameraMode);
  const cameraFocusTarget = useLabStore(state => state.cameraFocusTarget);

  const orbitAngleRef = useRef(0);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    if (cameraMode === 'FOLLOW_BOT' && bot.phase !== 'SLEEP_BENCH') {
      // Find stand target
      const targetStand = bot.targetStandId ? stands[bot.targetStandId] : null;
      let targetCenter = bot.position;

      if (targetStand) {
        // Frame the specific stand closely: target stand position + elevated viewpoint
        const desiredTarget = new THREE.Vector3(targetStand.position[0], 2.2, targetStand.position[2]);
        controlsRef.current.target.lerp(desiredTarget, 0.05);

        // Position camera 5.5 meters away at a 35-degree angle
        const desiredCamPos = new THREE.Vector3(
          targetStand.position[0] + 4.5,
          3.5,
          targetStand.position[2] + 4.8
        );
        camera.position.lerp(desiredCamPos, 0.04);
      } else {
        const desiredTarget = new THREE.Vector3(bot.position[0], bot.position[1], bot.position[2]);
        controlsRef.current.target.lerp(desiredTarget, 0.05);
      }
    } else {
      // When bot is at sleep bench or in ORBIT_ROOM mode: orbit smoothly over the entire room
      orbitAngleRef.current += delta * 0.12;
      const radius = 24;
      const height = 14;

      const targetLook = new THREE.Vector3(0, 2.0, 0);
      controlsRef.current.target.lerp(targetLook, 0.04);

      // Only auto-orbit if user hasn't actively interacted for a while or if in ORBIT_ROOM mode
      const targetCamX = Math.cos(orbitAngleRef.current) * radius;
      const targetCamZ = Math.sin(orbitAngleRef.current) * radius;
      const desiredCamPos = new THREE.Vector3(targetCamX, height, targetCamZ);

      camera.position.lerp(desiredCamPos, 0.02);
    }

    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      maxPolarAngle={Math.PI / 2 - 0.05} // don't go below floor
      minDistance={3}
      maxDistance={45}
    />
  );
};

