'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MusicController({ playing, available, onToggle }: { playing: boolean; available: boolean; onToggle: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      className="music-control"
      onClick={onToggle}
      disabled={!available}
      aria-label={playing ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
      title={available ? undefined : 'Thêm tệp nhạc trong config để bật âm thanh'}
    >
      {playing ? <Volume2 /> : <VolumeX />}
      {playing ? <span className="audio-bars" aria-hidden="true"><i /><i /><i /></span> : null}
    </Button>
  );
}
