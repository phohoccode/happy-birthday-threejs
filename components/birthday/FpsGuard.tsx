'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

export function FpsGuard({ onSlow }: { onSlow: () => void }) {
  const sample = useRef({ frames: 0, elapsed: 0, slowWindows: 0, reported: false });
  useFrame((_, delta) => {
    if (sample.current.reported) return;
    if (document.visibilityState === 'hidden') return;
    sample.current.frames += 1;
    sample.current.elapsed += delta;
    if (sample.current.elapsed < 2.5) return;
    const fps = sample.current.frames / sample.current.elapsed;
    sample.current.slowWindows = fps < 42 ? sample.current.slowWindows + 1 : 0;
    sample.current.frames = 0;
    sample.current.elapsed = 0;
    if (sample.current.slowWindows >= 2) {
      sample.current.reported = true;
      onSlow();
    }
  });
  return null;
}
