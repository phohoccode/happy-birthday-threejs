'use client';

import { useEffect, useState } from 'react';

export type DeviceQuality = 'low' | 'medium' | 'high';

export function useDeviceQuality(): DeviceQuality {
  const [quality, setQuality] = useState<DeviceQuality>('medium');

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
