'use client';

import { Float, Sparkles } from '@react-three/drei';
import { useMemo } from 'react';
import { CatmullRomCurve3, Color, DoubleSide, TubeGeometry, Vector3 } from 'three';

function Ribbon({ points, color }: { points: [number, number, number][]; color: string }) {
  const geometry = useMemo(() => {
    const curve = new CatmullRomCurve3(points.map((point) => new Vector3(...point)));
    return new TubeGeometry(curve, 44, 0.022, 6, false);
  }, [points]);
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color={color} transparent opacity={0.38} toneMapped={false} />
    </mesh>
  );
}

function Island({ position, accent }: { position: [number, number, number]; accent: string }) {
  return (
    <Float speed={0.7} rotationIntensity={0.08} floatIntensity={0.3}>
      <group position={position}>
        <mesh><cylinderGeometry args={[0.62, 0.22, 0.34, 8]} /><meshStandardMaterial color="#29213f" roughness={0.82} /></mesh>
        <mesh position={[0, 0.28, 0]}><boxGeometry args={[0.32, 0.32, 0.32]} /><meshStandardMaterial color={accent} roughness={0.38} metalness={0.18} /></mesh>
        <mesh position={[0, 0.29, 0.17]}><boxGeometry args={[0.055, 0.34, 0.02]} /><meshStandardMaterial color="#f7d774" metalness={0.75} roughness={0.28} /></mesh>
      </group>
    </Float>
  );
}

export function WorldDecor({ reducedMotion }: { reducedMotion: boolean }) {
  const ribbonOne = useMemo(() => [[-5, 1.8, 1], [-2.5, 2.8, -1], [0, 1.7, -2], [2.8, 2.5, -1], [5.4, 1.1, 0]] as [number, number, number][], []);
  const ribbonTwo = useMemo(() => [[-4.5, -1.4, -1], [-2, -0.7, 1], [1.2, -1.2, 0], [4.8, -0.2, -2]] as [number, number, number][], []);
  return (
    <group>
      <mesh position={[-5.2, 3.3, -6]}><sphereGeometry args={[1.28, 36, 36]} /><meshStandardMaterial color="#efe8ff" emissive="#8170b8" emissiveIntensity={0.35} roughness={0.92} /></mesh>
      <group position={[0, -1.9, -5]}>
        {[-4.2, -3.3, -2.4, 2.7, 3.6, 4.5].map((x, index) => <mesh key={x} position={[x, Math.sin(index * 1.7) * .22, index % 2 ? -.6 : 0]} scale={[1.6, .48, .72]}><sphereGeometry args={[1, 18, 18]} /><meshBasicMaterial color="#9a8caf" transparent opacity={0.055} depthWrite={false} /></mesh>)}
      </group>
      <mesh position={[-4.55, 2.65, -4.8]} rotation={[0, 0, -0.55]}><coneGeometry args={[1.25, 6.5, 32, 1, true]} /><meshBasicMaterial color="#d9c8ff" transparent opacity={0.045} depthWrite={false} side={DoubleSide} /></mesh>
      <Float speed={reducedMotion ? 0 : 0.65} floatIntensity={reducedMotion ? 0 : 0.2} rotationIntensity={0.05}>
        <Ribbon points={ribbonOne} color="#d8b7ff" /><Ribbon points={ribbonTwo} color="#f7d774" />
      </Float>
      <Island position={[-3.3, -1.65, -2.4]} accent="#7859a4" /><Island position={[3.6, -1.15, -3.2]} accent="#a8597a" />
      <Sparkles count={reducedMotion ? 18 : 52} scale={[10, 6, 5]} size={1.4} speed={reducedMotion ? 0 : 0.2} color={new Color('#f7d774')} opacity={0.25} />
    </group>
  );
}
