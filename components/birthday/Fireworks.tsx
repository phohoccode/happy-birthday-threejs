'use client';

import { PointMaterial, Points } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';

const COLORS = ['#f7d774', '#f9a8d4', '#a78bfa', '#fff1da'];

function Burst({ offset, color, delay }: { offset: [number, number, number]; color: string; delay: number }) {
  const ref = useRef<Group>(null);
  const positions = useMemo(() => {
    const result = new Float32Array(82 * 3);
    for (let i = 0; i < 82; i += 1) {
      const phi = Math.acos(2 * ((i + 0.5) / 82) - 1);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const radius = 0.65 + (i % 7) * 0.07;
      result[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      result[i * 3 + 1] = Math.cos(phi) * radius;
      result[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
    }
    return result;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = Math.max(0, ((clock.elapsedTime + delay) % 4.2) - 0.3);
    const pulse = t < 1.65 ? Math.min(1.8, t * 1.45) : Math.max(0.02, 1.8 - (t - 1.65) * 0.9);
    ref.current.scale.setScalar(pulse);
    ref.current.rotation.z += 0.001;
    ref.current.visible = t < 3.5;
  });

  return (
    <group ref={ref} position={offset}>
      <Points positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial transparent color={color} size={0.055} sizeAttenuation depthWrite={false} opacity={0.9} />
      </Points>
    </group>
  );
}

export function Fireworks({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  if (!active) return null;
  return (
    <group position={[0, 1.1, -2.2]}>
      <Burst offset={[-2.5, 1.3, 0]} color={COLORS[0]} delay={0} />
      {!reducedMotion ? <Burst offset={[2.2, 1.85, -0.5]} color={COLORS[1]} delay={1.3} /> : null}
      {!reducedMotion ? <Burst offset={[0.15, 2.7, -1]} color={COLORS[2]} delay={2.5} /> : null}
    </group>
  );
}
