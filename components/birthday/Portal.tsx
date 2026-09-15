'use client';

import { Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, Mesh } from 'three';

export function Portal({ reducedMotion }: { reducedMotion: boolean }) {
  const ring = useRef<Group>(null);
  const core = useRef<Mesh>(null);
  const dust = useMemo(() => Array.from({ length: 34 }, (_, index) => {
    const angle = (index / 34) * Math.PI * 2;
    const radius = 2.08 + Math.sin(index * 2.17) * 0.18;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sin(index) * 0.18] as [number, number, number];
  }), []);

  useFrame(({ clock }) => {
    if (ring.current) ring.current.rotation.z = reducedMotion ? 0.1 : clock.elapsedTime * 0.16;
    if (core.current) {
      const pulse = reducedMotion ? 1 : 1 + Math.sin(clock.elapsedTime * 2.8) * 0.045;
      core.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={[0, 0, -0.8]}>
      <mesh ref={core}>
        <circleGeometry args={[1.76, 72]} />
        <meshBasicMaterial color="#17113b" transparent opacity={0.82} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.05]}>
        <torusGeometry args={[1.86, 0.12, 16, 96]} />
        <meshBasicMaterial color="#d4b7ff" transparent opacity={0.82} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.08]}>
        <torusGeometry args={[2.03, 0.025, 8, 96]} />
        <meshBasicMaterial color="#f7d774" transparent opacity={0.68} toneMapped={false} />
      </mesh>
      <group ref={ring}>
        {dust.map((position, index) => (
          <mesh key={index} position={position} scale={index % 3 === 0 ? 0.045 : 0.026}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshBasicMaterial color={index % 4 === 0 ? '#f7d774' : '#c7a7ff'} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <Sparkles count={reducedMotion ? 22 : 88} scale={[4.4, 4.4, 1]} size={2.2} speed={reducedMotion ? 0 : 0.8} color="#d9c5ff" opacity={0.7} />
      <pointLight color="#aa7cff" intensity={5} distance={10} />
    </group>
  );
}
