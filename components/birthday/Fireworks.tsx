'use client';

import { PointMaterial, Points } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, PointsMaterial } from 'three';
import { QUALITY_PROFILES, type DeviceQuality } from '@/hooks/useDeviceQuality';

type BurstKind = 'sphere' | 'ring' | 'heart' | 'willow' | 'waterfall' | 'spiral';
const COLORS = ['#f7d774', '#f1b1cc', '#b39bea', '#fff1da'];

function createShape(kind: BurstKind, count: number) {
  const values = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const t = index / count;
    let x = 0; let y = 0; let z = 0;
    if (kind === 'heart') {
      const a = t * Math.PI * 2; x = Math.sin(a) ** 3 * 0.075; y = (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * 0.075; z = ((index % 5) - 2) * 0.025;
    } else if (kind === 'ring') {
      const a = t * Math.PI * 2; x = Math.cos(a); y = Math.sin(a); z = Math.sin(index * 2.1) * 0.08;
    } else if (kind === 'waterfall') {
      x = (t - 0.5) * 3; y = -Math.abs(Math.sin(t * Math.PI * 8)) * (0.5 + t); z = Math.sin(index * 1.9) * 0.2;
    } else if (kind === 'spiral') {
      const a = t * Math.PI * 8; x = Math.cos(a) * t; y = Math.sin(a) * t; z = (t - 0.5) * 0.7;
    } else {
      const phi = Math.acos(2 * ((index + 0.5) / count) - 1); const theta = Math.PI * (1 + Math.sqrt(5)) * index; const radius = kind === 'willow' ? 0.72 + (index % 7) * 0.045 : 0.7 + (index % 6) * 0.06;
      x = Math.sin(phi) * Math.cos(theta) * radius; y = Math.cos(phi) * radius * (kind === 'willow' ? 1.35 : 1); z = Math.sin(phi) * Math.sin(theta) * radius;
    }
    values[index * 3] = x; values[index * 3 + 1] = y; values[index * 3 + 2] = z;
  }
  return values;
}

function Burst({ offset, color, delay, kind, particles, duration = 2.6 }: { offset: [number, number, number]; color: string; delay: number; kind: BurstKind; particles: number; duration?: number }) {
  const group = useRef<Group>(null);
  const material = useRef<PointsMaterial>(null);
  const started = useRef<number | null>(null);
  const positions = useMemo(() => createShape(kind, particles), [kind, particles]);
  useFrame(({ clock }) => {
    if (!group.current || !material.current) return;
    if (started.current === null) started.current = clock.elapsedTime;
    const elapsed = clock.elapsedTime - started.current;
    const time = elapsed < delay ? -1 : (elapsed - delay) % 7.2;
    const active = time >= 0 && time <= duration;
    group.current.visible = active;
    if (!active) return;
    const progress = time / duration;
    const scale = 0.08 + Math.min(1, progress * 3.2) * (kind === 'heart' ? 1.35 : 1.8);
    group.current.scale.setScalar(scale);
    group.current.position.y = offset[1] - Math.max(0, progress - 0.3) ** 2 * (kind === 'willow' || kind === 'waterfall' ? 2.3 : 0.8);
    material.current.opacity = Math.min(1, time * 4) * Math.max(0, 1 - progress ** 2.2);
  });
  return <group ref={group} position={offset}><Points positions={positions} stride={3}><PointMaterial ref={material} transparent color={color} size={0.13} sizeAttenuation depthWrite={false} opacity={0} /></Points></group>;
}

export function Fireworks({ active, finale, reducedMotion, quality }: { active: boolean; finale: boolean; reducedMotion: boolean; quality: DeviceQuality }) {
  if (!active) return null;
  const profile = QUALITY_PROFILES[quality];
  const density = reducedMotion ? Math.min(2, profile.fireworksBursts) : finale ? profile.fireworksBursts : Math.min(profile.fireworksBursts, 6);
  const sequence = [
    { offset: [-2.9, 1.5, -1] as [number, number, number], kind: 'sphere' as const, delay: 0 },
    { offset: [0, 2.5, -2] as [number, number, number], kind: 'ring' as const, delay: 0.65 },
    { offset: [2.9, 1.65, -1] as [number, number, number], kind: 'willow' as const, delay: 1.3 },
    { offset: [-1.7, 2.7, -2] as [number, number, number], kind: 'spiral' as const, delay: 2.3 },
    { offset: [1.55, 2.75, -2] as [number, number, number], kind: 'sphere' as const, delay: 2.35 },
    { offset: [0, 2.05, -1] as [number, number, number], kind: 'heart' as const, delay: 3.8 },
    { offset: [0, 3.2, -3] as [number, number, number], kind: 'waterfall' as const, delay: 5.2 },
    { offset: [-3.4, 2.4, -2] as [number, number, number], kind: 'ring' as const, delay: 5.9 },
    { offset: [3.4, 2.35, -2] as [number, number, number], kind: 'sphere' as const, delay: 6.1 },
  ].slice(0, density);
  return <group position={[0, 0.55, -2.8]}>{sequence.map((burst, index) => <Burst key={`${burst.kind}-${index}`} {...burst} particles={burst.kind === 'heart' ? Math.round(profile.fireworksParticles * 1.15) : profile.fireworksParticles} color={COLORS[index % COLORS.length]} />)}</group>;
}
