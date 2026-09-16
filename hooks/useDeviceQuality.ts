'use client';

import { useEffect, useState } from 'react';

export type DeviceQuality = 'low' | 'medium' | 'high';

export const QUALITY_PROFILES: Record<DeviceQuality, {
  dpr: [number, number];
  stars: number;
  warp: number;
  sparkles: number;
  fireworksBursts: number;
  fireworksParticles: number;
}> = {
  low: { dpr: [0.75, 1.05], stars: 320, warp: 260, sparkles: 24, fireworksBursts: 4, fireworksParticles: 60 },
  medium: { dpr: [0.9, 1.22], stars: 700, warp: 520, sparkles: 44, fireworksBursts: 6, fireworksParticles: 84 },
  high: { dpr: [1, 1.45], stars: 1300, warp: 900, sparkles: 64, fireworksBursts: 8, fireworksParticles: 110 },
};

export function useDeviceQuality(): DeviceQuality {
  const [quality, setQuality] = useState<DeviceQuality>('low');

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const cores = navigator.hardwareConcurrency || 4;
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
      const narrow = window.matchMedia('(max-width: 767px)').matches;
      const denseDisplay = window.devicePixelRatio > 2.25;
      setQuality(narrow || denseDisplay || cores <= 4 || memory <= 4 ? 'low' : cores >= 8 && memory >= 8 ? 'high' : 'medium');
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return quality;
}
