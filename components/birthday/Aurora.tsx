'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { ShaderMaterial } from 'three';

const vertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.y += sin(p.x * 1.7 + uTime * .45) * .22 + sin(p.x * .7 - uTime * .25) * .12;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float curtain = sin(vUv.x * 18.0 + uTime * .35) * .5 + .5;
    float edge = smoothstep(0.0, .22, vUv.y) * (1.0 - smoothstep(.62, 1.0, vUv.y));
    vec3 lavender = vec3(.43, .31, .72);
    vec3 rose = vec3(.55, .28, .48);
    vec3 color = mix(lavender, rose, vUv.x + sin(uTime * .15) * .08);
    gl_FragColor = vec4(color, edge * (.58 + curtain * .32) * .22);
  }
`;

export function Aurora({ reducedMotion }: { reducedMotion: boolean }) {
  const material = useRef<ShaderMaterial>(null);
  useFrame(({ clock }) => {
    if (material.current && !reducedMotion) material.current.uniforms.uTime.value = clock.elapsedTime;
  });
  return (
    <mesh position={[0, 3.15, -7]} scale={[8.5, 2.2, 1]}>
      <planeGeometry args={[1, 1, 48, 14]} />
      <shaderMaterial ref={material} transparent depthWrite={false} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={{ uTime: { value: 0 } }} />
    </mesh>
  );
}
