'use client';

import { Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, Mesh, ShaderMaterial } from 'three';

const portalVertex = `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float wave = sin(atan(p.y, p.x) * 9.0 - uTime * 2.2) * .022;
    p.xy *= 1.0 + wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const portalFragment = `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - .5;
    float radius = length(p);
    float angle = atan(p.y, p.x);
    float noise = sin(angle * 13.0 - uTime * 2.4 + radius * 28.0) * .5 + .5;
    float spiral = sin(angle * 5.0 + radius * 42.0 - uTime * 1.7) * .5 + .5;
    vec3 deep = vec3(.035, .025, .12);
    vec3 violet = vec3(.42, .22, .76);
    vec3 color = mix(deep, violet, (noise * .42 + spiral * .2) * (1.0 - radius));
    float edge = 1.0 - smoothstep(.38, .51, radius);
    float stars = step(.992, fract(sin(dot(floor(vUv * 90.0), vec2(12.9898, 78.233))) * 43758.5453));
    gl_FragColor = vec4(color + stars * vec3(.9, .82, 1.0), edge * .94);
  }
`;

export function Portal({ reducedMotion }: { reducedMotion: boolean }) {
  const ring = useRef<Group>(null);
  const core = useRef<Mesh>(null);
  const material = useRef<ShaderMaterial>(null);
  const dust = useMemo(() => Array.from({ length: reducedMotion ? 34 : 96 }, (_, index) => {
    const angle = (index / (reducedMotion ? 34 : 96)) * Math.PI * 2;
    const radius = 2.08 + Math.sin(index * 2.17) * 0.18;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sin(index) * 0.18] as [number, number, number];
  }), [reducedMotion]);

  useFrame(({ clock }) => {
    if (ring.current) ring.current.rotation.z = reducedMotion ? 0.1 : clock.elapsedTime * 0.16;
    if (material.current && !reducedMotion) material.current.uniforms.uTime.value = clock.elapsedTime;
    if (core.current) {
      const pulse = reducedMotion ? 1 : 1 + Math.sin(clock.elapsedTime * 2.8) * 0.045;
      core.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={[0, 0, -0.8]}>
      <mesh ref={core}><circleGeometry args={[1.76, 96]} /><shaderMaterial ref={material} transparent depthWrite={false} vertexShader={portalVertex} fragmentShader={portalFragment} uniforms={{ uTime: { value: 0 } }} /></mesh>
      <mesh position={[0, 0, -0.05]}><torusGeometry args={[1.86, 0.12, 16, 96]} /><meshBasicMaterial color="#d4b7ff" transparent opacity={0.82} toneMapped={false} /></mesh>
      <mesh position={[0, 0, -0.08]}><torusGeometry args={[2.03, 0.025, 8, 96]} /><meshBasicMaterial color="#f7d774" transparent opacity={0.68} toneMapped={false} /></mesh>
      <group ref={ring}>{dust.map((position, index) => <mesh key={index} position={position} scale={index % 3 === 0 ? 0.045 : 0.026}><sphereGeometry args={[1, 6, 6]} /><meshBasicMaterial color={index % 4 === 0 ? '#f7d774' : '#c7a7ff'} toneMapped={false} /></mesh>)}</group>
      <mesh position={[0, -2.1, -1.8]} rotation={[0, 0, Math.PI]}><coneGeometry args={[2.1, 6, 40, 1, true]} /><meshBasicMaterial color="#a77ee4" transparent opacity={0.045} depthWrite={false} /></mesh>
      <Sparkles count={reducedMotion ? 22 : 112} scale={[4.4, 4.4, 1]} size={2.2} speed={reducedMotion ? 0 : 0.8} color="#d9c5ff" opacity={0.7} />
      <pointLight color="#aa7cff" intensity={5} distance={10} />
    </group>
  );
}
