'use client';

import { Float, Line, Sparkles } from '@react-three/drei';
import { useMemo, useState } from 'react';

type BalloonProps = {
  position: [number, number, number];
  color: string;
  scale: number;
  reducedMotion: boolean;
};

function Balloon({ position, color, scale, reducedMotion }: BalloonProps) {
  const [popped, setPopped] = useState(false);
  const stringPoints = useMemo(() => [[0, -0.65, 0], [0.08, -1.25, 0], [-0.02, -1.95, 0]] as [number, number, number][], []);
  if (popped) {
    return <Sparkles position={position} count={18} scale={0.8} color={color} size={3} speed={0.6} />;
  }
  return (
    <Float speed={reducedMotion ? 0 : 1.4} rotationIntensity={reducedMotion ? 0 : 0.18} floatIntensity={reducedMotion ? 0 : 0.55}>
      <group position={position} scale={scale} onClick={(event) => { event.stopPropagation(); setPopped(true); }}>
        <mesh castShadow scale={[0.78, 1, 0.78]}>
          <sphereGeometry args={[0.62, 28, 28]} />
          <meshPhysicalMaterial color={color} roughness={0.24} metalness={0.08} clearcoat={0.9} clearcoatRoughness={0.22} />
        </mesh>
        <mesh position={[0, -0.62, 0]} rotation={[0, 0, Math.PI / 4]}>
          <coneGeometry args={[0.09, 0.18, 4]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <Line points={stringPoints} color="#bdaec8" lineWidth={0.7} transparent opacity={0.5} />
      </group>
    </Float>
  );
}

export function Balloons({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <group>
      <Balloon position={[-3.5, 0.5, -1.5]} color="#a78bfa" scale={0.85} reducedMotion={reducedMotion} />
      <Balloon position={[3.4, 1.2, -2]} color="#e99ab8" scale={1} reducedMotion={reducedMotion} />
      <Balloon position={[-4.1, 2.5, -3]} color="#d6ad58" scale={0.62} reducedMotion={reducedMotion} />
      <Balloon position={[4.3, -0.9, -3]} color="#7668bd" scale={0.7} reducedMotion={reducedMotion} />
      <Balloon position={[-5.8, -1.1, 1.4]} color="#c17897" scale={1.28} reducedMotion={reducedMotion} />
      <Balloon position={[5.6, 2.8, 0.8]} color="#8e78cd" scale={1.18} reducedMotion={reducedMotion} />
      <Balloon position={[1.9, 3.7, -5]} color="#c7963d" scale={0.48} reducedMotion={reducedMotion} />
    </group>
  );
}
