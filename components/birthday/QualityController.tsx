'use client';

import { Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DeviceQuality } from '@/hooks/useDeviceQuality';

const NEXT: Record<DeviceQuality, DeviceQuality> = { low: 'medium', medium: 'high', high: 'low' };

export function QualityController({ quality, onChange }: { quality: DeviceQuality; onChange: (quality: DeviceQuality) => void }) {
  return (
    <Button className="quality-control" type="button" variant="ghost" onClick={() => onChange(NEXT[quality])} aria-label={`Chất lượng hình ảnh: ${quality}. Chạm để đổi.`} title="Đổi chất lượng hình ảnh">
      <Gauge aria-hidden="true" /> <span>{quality.toUpperCase()}</span>
    </Button>
  );
}
