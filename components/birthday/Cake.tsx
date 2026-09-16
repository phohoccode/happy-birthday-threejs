'use client';

import { Float, Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';

type BlowPhase = 'idle' | 'gust' | 'smoke' | 'boom';
type CakeProps = { age?: number; candlesOut: boolean; ceremony: boolean; blowPhase: BlowPhase; reducedMotion: boolean };

function Flame({ out, gust, index, lit }: { out: boolean; gust: boolean; index: number; lit: boolean }) {
  const flame = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!flame.current || out || !lit) return;
    const t = clock.elapsedTime * (gust ? 13 : 7) + index * 1.7;
    flame.current.scale.set(1 + Math.sin(t) * (gust ? 0.22 : 0.08), 1 + Math.cos(t * 0.8) * (gust ? 0.23 : 0.11), 1);
    flame.current.rotation.z = (gust ? 0.62 : 0.06) + Math.sin(t * 0.7) * (gust ? 0.18 : 0.06);
  });
  if (out || !lit) return null;
  return (
    <group ref={flame} position={[0, 0.43, 0]}>
      <mesh scale={[0.72, 1.4, 0.72]}><sphereGeometry args={[0.105, 16, 16]} /><meshBasicMaterial color="#ff9c4b" transparent opacity={0.9} toneMapped={false} /></mesh>
      <mesh position={[0, -0.02, 0.012]} scale={[0.42, 0.82, 0.42]}><sphereGeometry args={[0.1, 14, 14]} /><meshBasicMaterial color="#fff5bf" toneMapped={false} /></mesh>
      <Sparkles count={3} scale={[0.25, 0.75, 0.25]} position={[0, 0.36, 0]} color="#ffd27d" size={1.2} speed={0.32} />
    </group>
  );
}

function Candle({ x, index, ceremony, out, gust, reducedMotion }: { x: number; index: number; ceremony: boolean; out: boolean; gust: boolean; reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const started = useRef<number | null>(null);
  const lit = useRef(false);
  useFrame(({ clock }) => {
    if (!group.current) return;
    if (!ceremony) {
      started.current = null;
      lit.current = false;
      group.current.scale.setScalar(0.001);
      return;
    }
    if (started.current === null) started.current = clock.elapsedTime;
    const delay = reducedMotion ? 0 : index * 0.34;
    const progress = Math.min(1, Math.max(0, (clock.elapsedTime - started.current - delay) / 0.5));
    const eased = 1 - Math.pow(1 - progress, 3);
    group.current.scale.setScalar(Math.max(0.001, eased));
    group.current.position.y = 1.33 - (1 - eased) * 0.36;
    lit.current = progress > 0.72;
  });
  return (
    <group ref={group} position={[x, 1.33, 0]}>
      <mesh><cylinderGeometry args={[0.065, 0.065, 0.68, 16]} /><meshStandardMaterial color={index === 1 ? '#f6cb73' : '#d8b7ff'} roughness={0.48} /></mesh>
      <mesh position={[0, 0.12, 0.065]} rotation={[0, 0, 0.45]}><boxGeometry args={[0.14, 0.035, 0.018]} /><meshBasicMaterial color={index === 1 ? '#fff1b5' : '#f0dcff'} /></mesh>
      <Flame out={out} gust={gust} index={index} lit={ceremony} />
    </group>
  );
}

function Drips({ radius, y }: { radius: number; y: number }) {
  return <>{Array.from({ length: 12 }, (_, index) => { const angle = index / 12 * Math.PI * 2; const length = 0.1 + (index % 4) * 0.055; return <mesh key={index} position={[Math.cos(angle) * radius, y - length * 0.45, Math.sin(angle) * radius]}><sphereGeometry args={[0.105, 12, 12]} /><meshStandardMaterial color="#fff3ea" roughness={0.52} /></mesh>; })}</>;
}

const DIGIT_SEGMENTS: Record<string, number[]> = {
  '0': [0, 1, 2, 3, 4, 5], '1': [1, 2], '2': [0, 1, 6, 4, 3], '3': [0, 1, 6, 2, 3], '4': [5, 6, 1, 2],
  '5': [0, 5, 6, 2, 3], '6': [0, 5, 6, 4, 2, 3], '7': [0, 1, 2], '8': [0, 1, 2, 3, 4, 5, 6], '9': [0, 1, 5, 6, 2, 3],
};
const SEGMENTS = [[0, .26, 0, .23, .045], [.14, .14, 0, .045, .2], [.14, -.14, 0, .045, .2], [0, -.26, 0, .23, .045], [-.14, -.14, 0, .045, .2], [-.14, .14, 0, .045, .2], [0, 0, 0, .23, .045]] as const;

function AgeNumber({ age }: { age: number }) {
  return <group position={[0, 1.42, -0.34]}>{String(age).slice(0, 2).split('').map((digit, digitIndex, digits) => <group key={`${digit}-${digitIndex}`} position={[(digitIndex - (digits.length - 1) / 2) * .38, 0, 0]}>{DIGIT_SEGMENTS[digit]?.map((segment) => { const [x, y, z, width, height] = SEGMENTS[segment]; return <mesh key={segment} position={[x, y, z]}><boxGeometry args={[width, height, .07]} /><meshStandardMaterial color="#e9bf63" emissive="#7d541b" emissiveIntensity={0.18} metalness={0.78} roughness={0.2} /></mesh>; })}</group>)}</group>;
}

export function Cake({ age, candlesOut, ceremony, blowPhase, reducedMotion }: CakeProps) {
  const group = useRef<Group>(null);
  const candlePositions = useMemo(() => [-0.52, 0, 0.52], []);
  useFrame(({ clock, pointer }) => {
    if (!group.current) return;
    group.current.rotation.y = reducedMotion ? 0.1 : clock.elapsedTime * 0.045 + pointer.x * 0.1;
    group.current.rotation.x = reducedMotion ? 0 : -pointer.y * 0.025;
  });
  return (
    <Float speed={reducedMotion ? 0 : 0.75} rotationIntensity={0} floatIntensity={reducedMotion ? 0 : 0.13}>
      <group ref={group} position={[0, -0.72, 0]}>
        <mesh position={[0, -0.96, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.7, .72, 1]}><circleGeometry args={[1.65, 48]} /><meshBasicMaterial color="#000000" transparent opacity={.24} depthWrite={false} /></mesh>
        <mesh position={[0, -0.79, 0]}><cylinderGeometry args={[2.18, 2.24, 0.14, 64]} /><meshStandardMaterial color="#b98b54" metalness={0.72} roughness={0.24} /></mesh>
        <mesh position={[0, -0.23, 0]}><cylinderGeometry args={[1.82, 1.9, 1, 64]} /><meshStandardMaterial color="#e7bfc6" roughness={0.52} /></mesh>
        <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[1.32, 1.43, 0.72, 64]} /><meshStandardMaterial color="#f2ded4" roughness={0.48} /></mesh>
        <mesh position={[0, 1.01, 0]}><cylinderGeometry args={[0.86, 0.96, 0.44, 64]} /><meshStandardMaterial color="#f7eee4" roughness={0.46} /></mesh>
        <mesh position={[0, 0.88, 0]}><torusGeometry args={[0.74, 0.105, 14, 64]} /><meshStandardMaterial color="#fff3ea" roughness={0.52} /></mesh>
        <Drips radius={1.7} y={0.18} /><Drips radius={1.23} y={0.76} />
        {Array.from({ length: 12 }, (_, index) => { const angle = index / 12 * Math.PI * 2; return <group key={index} position={[Math.cos(angle) * 1.55, 0.2, Math.sin(angle) * 1.55]} rotation={[0, -angle, 0]}><mesh scale={[1, 0.8, 0.9]}><sphereGeometry args={[0.14, 16, 16]} /><meshPhysicalMaterial color={index % 3 === 0 ? '#6e1734' : '#c86f8e'} roughness={0.4} clearcoat={0.25} /></mesh>{index % 3 === 0 ? <mesh position={[0, 0.13, 0]} rotation={[0, 0, 0.4]}><coneGeometry args={[0.08, 0.16, 5]} /><meshStandardMaterial color="#62835b" /></mesh> : null}</group>; })}
        {Array.from({ length: 7 }, (_, index) => { const angle = index / 7 * Math.PI * 2; return <mesh key={index} position={[Math.cos(angle) * 1.02, 0.83, Math.sin(angle) * 1.02]} rotation={[Math.PI / 2, 0, angle]}><torusGeometry args={[0.13, 0.052, 10, 24]} /><meshStandardMaterial color={index % 2 ? '#b886d5' : '#dda0b5'} roughness={0.42} /></mesh>; })}
        {Array.from({ length: 9 }, (_, index) => { const angle = index / 9 * Math.PI * 2; return <mesh key={index} position={[Math.cos(angle) * 0.68, 1.17, Math.sin(angle) * 0.68]} rotation={[0, 0, angle]}><octahedronGeometry args={[0.075, 0]} /><meshStandardMaterial color="#e9bf63" emissive="#8d6121" emissiveIntensity={0.16} metalness={0.78} roughness={0.22} /></mesh>; })}
        {[-.42, .42].map((x, index) => <group key={x} position={[x, 1.22, -.18]} rotation={[.18, 0, index ? -.25 : .25]}><mesh><boxGeometry args={[.2, .38, .07]} /><meshPhysicalMaterial color="#3f1f21" roughness={.28} clearcoat={.4} /></mesh><mesh position={[0, .2, .02]}><octahedronGeometry args={[.055, 0]} /><meshStandardMaterial color="#e9bf63" metalness={.75} /></mesh></group>)}
        {candlePositions.map((x, index) => <Candle key={x} x={x} index={index} ceremony={ceremony} out={candlesOut} gust={blowPhase === 'gust'} reducedMotion={reducedMotion} />)}
        {age ? <AgeNumber age={age} /> : null}
        {ceremony ? <pointLight position={[0, 1.55, -0.35]} color="#ffb65c" intensity={candlesOut ? (blowPhase === 'boom' ? 5 : 0.45) : 2.1} distance={6} decay={2} /> : null}
        {candlesOut ? <Sparkles count={20} scale={[1.7, 1.35, 1]} position={[0, 1.82, 0]} color="#c9c2d6" size={2} speed={0.18} opacity={0.26} /> : null}
      </group>
    </Float>
  );
}
