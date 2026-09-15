'use client';

import { Float, Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, Mesh } from 'three';
import { Color } from 'three';

type CakeProps = {
  age?: number;
  candlesOut: boolean;
  reducedMotion: boolean;
};

function Flame({ out, index }: { out: boolean; index: number }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current || out) return;
    const t = clock.elapsedTime * 6 + index;
    ref.current.scale.set(1 + Math.sin(t) * 0.08, 1 + Math.cos(t * 0.8) * 0.13, 1);
    ref.current.rotation.z = Math.sin(t * 0.7) * 0.08;
  });
  if (out) return null;
  return (
    <group position={[0, 0.39, 0]}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.085, 14, 14]} />
        <meshBasicMaterial color="#ffd18a" toneMapped={false} />
      </mesh>
      <pointLight color="#ffb65c" intensity={1.8} distance={2.4} decay={2} />
    </group>
  );
}

export function Cake({ age, candlesOut, reducedMotion }: CakeProps) {
  const group = useRef<Group>(null);
  const candlePositions = useMemo(() => [-0.55, 0, 0.55], []);

  useFrame(({ clock, pointer }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    group.current.rotation.y = reducedMotion ? 0.12 : t * 0.07 + pointer.x * 0.12;
    group.current.rotation.x = reducedMotion ? 0 : -pointer.y * 0.035;
  });

  return (
    <Float speed={reducedMotion ? 0 : 1.2} rotationIntensity={0} floatIntensity={reducedMotion ? 0 : 0.18}>
      <group ref={group} position={[0, -0.55, 0]}>
        <mesh receiveShadow position={[0, -0.75, 0]}>
          <cylinderGeometry args={[2.15, 2.2, 0.16, 64]} />
          <meshStandardMaterial color="#b78b60" metalness={0.58} roughness={0.3} />
        </mesh>
        <mesh castShadow position={[0, -0.2, 0]}>
          <cylinderGeometry args={[1.78, 1.88, 0.95, 64]} />
          <meshStandardMaterial color="#f5d7d8" roughness={0.45} />
        </mesh>
        <mesh castShadow position={[0, 0.48, 0]}>
          <cylinderGeometry args={[1.28, 1.38, 0.62, 64]} />
          <meshStandardMaterial color="#f6e9dc" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.8, 0]}>
          <torusGeometry args={[1.05, 0.12, 12, 64]} />
          <meshStandardMaterial color="#fff4e6" roughness={0.55} />
        </mesh>
        {Array.from({ length: 10 }).map((_, index) => {
          const angle = (index / 10) * Math.PI * 2;
          return (
            <mesh key={index} position={[Math.cos(angle) * 1.58, 0.18, Math.sin(angle) * 1.58]}>
              <sphereGeometry args={[0.13, 16, 16]} />
              <meshStandardMaterial color={index % 2 ? '#d98ca4' : '#7e1838'} roughness={0.5} />
            </mesh>
          );
        })}
        {candlePositions.map((x, index) => (
          <group key={x} position={[x, 1.12, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.07, 0.07, 0.62, 16]} />
              <meshStandardMaterial color={index === 1 ? '#f6cb73' : '#d8b7ff'} roughness={0.5} />
            </mesh>
            <Flame out={candlesOut} index={index} />
          </group>
        ))}
        {age ? (
          <group position={[0, 1.22, -0.28]}>
            <mesh position={[-0.14, 0, 0]}>
              <boxGeometry args={[0.18, 0.55, 0.08]} />
              <meshStandardMaterial color="#e9bf63" metalness={0.7} roughness={0.25} />
            </mesh>
            <mesh position={[0.14, 0, 0]}>
              <torusGeometry args={[0.17, 0.055, 12, 24]} />
              <meshStandardMaterial color="#e9bf63" metalness={0.7} roughness={0.25} />
            </mesh>
          </group>
        ) : null}
        {candlesOut ? (
          <Sparkles count={24} scale={[1.7, 1.3, 1]} position={[0, 1.75, 0]} color={new Color('#c9c2d6')} size={2} speed={0.18} opacity={0.28} />
        ) : null}
      </group>
    </Float>
  );
}
