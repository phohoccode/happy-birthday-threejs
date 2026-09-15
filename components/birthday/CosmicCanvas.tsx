'use client';

import { Environment, Sparkles, Stars } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import type { Group } from 'three';
import { Balloons } from './Balloons';
import { Cake } from './Cake';
import { Fireworks } from './Fireworks';
import type { DeviceQuality } from '@/hooks/useDeviceQuality';

function SceneRig({ opened, reducedMotion }: { opened: boolean; reducedMotion: boolean }) {
  const root = useRef<Group>(null);
  useFrame(({ camera, pointer }) => {
    if (!root.current) return;
    const scroll = typeof window === 'undefined' ? 0 : window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ease = 0.025;
    camera.position.x += ((reducedMotion ? 0 : pointer.x * 0.28) - camera.position.x) * ease;
    camera.position.y += ((reducedMotion ? 0.1 : pointer.y * 0.18 + scroll * 0.42) - camera.position.y) * ease;
    camera.lookAt(0, 0, 0);
    root.current.rotation.z = reducedMotion ? 0 : scroll * 0.035;
  });
  return <group ref={root} scale={opened ? 1 : 0.94} />;
}

type CosmicCanvasProps = {
  opened: boolean;
  candlesOut: boolean;
  fireworks: boolean;
  age?: number;
  quality: DeviceQuality;
  reducedMotion: boolean;
};

export function CosmicCanvas({ opened, candlesOut, fireworks, age, quality, reducedMotion }: CosmicCanvasProps) {
  const starCount = reducedMotion ? 350 : quality === 'high' ? 1900 : quality === 'medium' ? 1050 : 520;
  return (
    <Canvas
      className="cosmic-canvas"
      dpr={quality === 'high' ? [1, 1.65] : [0.75, 1.25]}
      camera={{ position: [0, 0.15, 7.5], fov: 44 }}
      gl={{ antialias: quality !== 'low', alpha: true, powerPreference: 'high-performance' }}
      shadows={false}
    >
      <fog attach="fog" args={['#070711', 7, 17]} />
      <ambientLight intensity={0.7} color="#8370b9" />
      <directionalLight position={[4, 7, 5]} intensity={2.1} color="#fff0cf" />
      <pointLight position={[-4, 2, 2]} intensity={1.8} color="#b189ff" distance={12} />
      <Suspense fallback={null}>
        <Stars radius={60} depth={30} count={starCount} factor={2.4} saturation={0.2} fade speed={reducedMotion ? 0 : 0.35} />
        <Sparkles count={quality === 'low' ? 36 : 72} scale={[10, 7, 5]} size={1.7} speed={reducedMotion ? 0 : 0.16} color="#f7d774" opacity={0.32} />
        <group scale={quality === 'low' ? 0.74 : 1}>
          <Cake age={age} candlesOut={candlesOut} reducedMotion={reducedMotion} />
        </group>
        <Balloons reducedMotion={reducedMotion} />
        <Fireworks active={fireworks} reducedMotion={reducedMotion} />
        {quality === 'high' ? <Environment preset="night" /> : null}
      </Suspense>
      <SceneRig opened={opened} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
