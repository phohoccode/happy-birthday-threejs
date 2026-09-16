'use client';

import { Float, Line, Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import { QUALITY_PROFILES, type DeviceQuality } from '@/hooks/useDeviceQuality';

const NODES: [number, number, number][] = [[-3.4, .55, -2], [-1.05, 2.05, -3.4], [1.2, 1.55, -4.1], [3.35, .35, -2.3], [1.4, -1.45, -3.2], [-1.2, -1.55, -3.8], [0, -.2, -4.6]];

function MemoryNode({ position, index, reducedMotion }: { position: [number, number, number]; index: number; reducedMotion: boolean }) {
  return (
    <Float speed={reducedMotion ? 0 : .55 + index * .04} floatIntensity={reducedMotion ? 0 : .18} rotationIntensity={.08}>
      <group position={position}>
        <mesh><sphereGeometry args={[index === 6 ? .18 : .11, 18, 18]} /><meshBasicMaterial color={index % 2 ? '#f7d774' : '#cfb5ff'} toneMapped={false} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, index * .4]}><torusGeometry args={[index === 6 ? .42 : .28, .012, 8, 40]} /><meshBasicMaterial color={index % 2 ? '#f0c96a' : '#9f7bd6'} transparent opacity={.4} /></mesh>
      </group>
    </Float>
  );
}

export function MemoryUniverse3D({ reducedMotion, quality }: { reducedMotion: boolean; quality: DeviceQuality }) {
  const root = useRef<Group>(null);
  const sparkleCount = reducedMotion ? Math.min(18, QUALITY_PROFILES[quality].sparkles) : Math.round(QUALITY_PROFILES[quality].sparkles * 1.1);
  const connections = useMemo(() => [[NODES[0], NODES[1], NODES[6]], [NODES[6], NODES[2], NODES[3]], [NODES[0], NODES[5], NODES[4], NODES[3]]] as [number, number, number][][], []);
  useFrame(({ clock }) => { if (root.current && !reducedMotion) root.current.rotation.y = Math.sin(clock.elapsedTime * .12) * .055; });
  return (
    <group ref={root}>
      <pointLight color="#b896ff" intensity={2.2} distance={8} position={[0, 0.5, 1]} />
      {connections.map((points, index) => <Line key={index} points={points} color="#bda6de" lineWidth={.55} transparent opacity={.22} />)}
      {NODES.map((position, index) => <MemoryNode key={index} position={position} index={index} reducedMotion={reducedMotion} />)}
      <Sparkles count={sparkleCount} scale={[9, 6, 5]} color="#baa0e3" size={1.1} speed={reducedMotion ? 0 : .12} opacity={.24} />
    </group>
  );
}
