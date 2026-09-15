'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { BufferGeometry } from 'three';

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export function WarpTunnel({ count, reducedMotion }: { count: number; reducedMotion: boolean }) {
  const geometry = useRef<BufferGeometry>(null);
  const positions = useMemo(() => {
    const result = new Float32Array(count * 6);
    for (let index = 0; index < count; index += 1) {
      const angle = pseudoRandom(index + 2) * Math.PI * 2;
      const radius = 1.2 + pseudoRandom(index + 9) * 8;
      const z = -pseudoRandom(index + 19) * 36;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      result[index * 6] = x;
      result[index * 6 + 1] = y;
      result[index * 6 + 2] = z;
      result[index * 6 + 3] = x;
      result[index * 6 + 4] = y;
      result[index * 6 + 5] = z - (reducedMotion ? 0.25 : 1.8);
    }
    return result;
  }, [count, reducedMotion]);

  useFrame((_, delta) => {
    const attribute = geometry.current?.getAttribute('position');
    if (!attribute) return;
    const speed = reducedMotion ? 1.5 : 12;
    for (let index = 0; index < count; index += 1) {
      const offset = index * 6;
      let z = attribute.array[offset + 2] + delta * speed;
      if (z > 3) z -= 38;
      attribute.array[offset + 2] = z;
      attribute.array[offset + 5] = z - (reducedMotion ? 0.25 : 1.8);
    }
    attribute.needsUpdate = true;
  });

  return (
    <lineSegments frustumCulled={false}>
      <bufferGeometry ref={geometry}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#e4d7ff" transparent opacity={0.72} toneMapped={false} />
    </lineSegments>
  );
}
