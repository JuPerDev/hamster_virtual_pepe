import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ActionType } from '../types';

interface HamsterSceneProps {
  currentAction: ActionType | null;
}

export function HamsterModel({ currentAction }: HamsterSceneProps) {
  // En Expo, los assets locales .glb requieren estar en metro.config.js y cargarse vía require
  const { scene } = useGLTF(require('../assets/hamster.glb'));
  const rootRef = useRef<THREE.Group>(null);
  const pivotRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);

  const [baseY, setBaseY] = useState(0);

  useEffect(() => {
    if (scene) {
      // Normalize model size and center
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxAxis = Math.max(size.x, size.y, size.z) || 1;

      scene.position.sub(center);
      scene.scale.setScalar(1.95 / maxAxis);

      const normalizedBox = new THREE.Box3().setFromObject(scene);
      const normalizedCenter = normalizedBox.getCenter(new THREE.Vector3());
      const normalizedSize = normalizedBox.getSize(new THREE.Vector3());
      scene.position.x -= normalizedCenter.x;
      scene.position.y -= normalizedCenter.y;
      scene.position.z -= normalizedCenter.z;
      
      const newBaseY = -0.08 + Math.max(0, 1.5 - normalizedSize.y) * 0.1;
      setBaseY(newBaseY);
      if (pivotRef.current) pivotRef.current.position.y = newBaseY;

      // Enhance materials
      scene.traverse((node: any) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          if (node.material) {
            node.material.roughness = Math.min(node.material.roughness ?? 0.75, 0.86);
            node.material.envMapIntensity = 0.65;
            node.material.needsUpdate = true;
          }
        }
      });
    }
  }, [scene]);

  const [actionTime, setActionTime] = useState(0);

  useFrame((state, delta) => {
    if (!rootRef.current || !shadowRef.current || !pivotRef.current) return;

    // Increment time
    setActionTime(prev => prev + delta);
    const t = actionTime;
    const elapsed = state.clock.elapsedTime;

    const idleBob = Math.sin(elapsed * 1.8) * 0.018;
    const idleTurn = Math.sin(elapsed * 0.85) * 0.035;

    // Reset base properties
    rootRef.current.position.set(0, idleBob, 0);
    rootRef.current.rotation.set(0, idleTurn, 0);
    rootRef.current.scale.setScalar(1);
    
    shadowRef.current.scale.set(1.2 + idleBob * 1.2, 0.4, 1);
    if (shadowRef.current.material instanceof THREE.Material) {
        shadowRef.current.material.opacity = 0.22 - idleBob * 0.4;
    }

    const current = currentAction || 'idle';

    if (current === 'walking') {
      rootRef.current.position.y = Math.sin(t * 6) * 0.015;
      rootRef.current.rotation.z = Math.sin(t * 5) * 0.018;
      rootRef.current.rotation.y = idleTurn + Math.sin(t * 4) * 0.025;
      shadowRef.current.scale.set(1.22, 0.38, 1);
    } else if (current === 'happy' || current === 'catching' || current === 'bounce') {
      const hop = Math.max(0, Math.sin(t * 5)) * 0.04;
      rootRef.current.position.y = hop;
      rootRef.current.rotation.z = Math.sin(t * 5) * 0.025;
      rootRef.current.rotation.y = idleTurn + Math.sin(t * 4) * 0.04;
      rootRef.current.scale.set(1 + hop * 0.04, 1 - hop * 0.02, 1 + hop * 0.02);
      shadowRef.current.scale.set(1.16 + hop * 0.35, 0.36, 1);
      if (shadowRef.current.material instanceof THREE.Material) shadowRef.current.material.opacity = 0.23 - hop * 0.18;
    } else if (current === 'eating') {
      const chew = Math.sin(t * 8);
      rootRef.current.position.y = -0.005 + Math.abs(chew) * 0.008;
      rootRef.current.rotation.x = 0.015 + Math.max(0, chew) * 0.015;
      rootRef.current.rotation.y = idleTurn * 0.5;
      rootRef.current.scale.set(1.015 + Math.abs(chew) * 0.01, 0.99, 1.01);
    } else if (current === 'sleeping') {
      rootRef.current.position.y = -0.025 + Math.sin(elapsed * 1.1) * 0.008;
      rootRef.current.rotation.z = -0.035;
      rootRef.current.rotation.x = 0.025;
      rootRef.current.scale.set(1.015, 0.985, 1.01);
      shadowRef.current.scale.set(1.26, 0.36, 1);
      if (shadowRef.current.material instanceof THREE.Material) shadowRef.current.material.opacity = 0.19;
    }
  });

  return (
    <group>
      {/* Lights */}
      <directionalLight color={0xffefd0} intensity={3.1} position={[2.4, 3.4, 4.2]} castShadow />
      <hemisphereLight color={0xfff2d8} groundColor={0x7b5d93} intensity={2.4} />
      <directionalLight color={0xbdd8ff} intensity={1.9} position={[-2.8, 1.8, -2.2]} />

      {/* Shadow */}
      <mesh ref={shadowRef} position={[0, -0.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.92, 48]} />
        <meshBasicMaterial color={0x2b1732} transparent opacity={0.26} depthWrite={false} />
      </mesh>

      {/* Model Root */}
      <group ref={rootRef}>
        <group ref={pivotRef}>
          <primitive object={scene} />
        </group>
      </group>
    </group>
  );
}
