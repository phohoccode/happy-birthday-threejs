'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useAudio(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.35;
    audio.preload = 'none';
    const handleError = () => setAvailable(false);
    audio.addEventListener('error', handleError);
    audioRef.current = audio;

    const handleVisibility = () => {
      if (document.hidden && !audio.paused) audio.pause();
      if (!document.hidden && playingRef.current) void audio.play().catch(() => undefined);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [src]);

  const play = useCallback(async () => {
    if (!audioRef.current || !available) return;
    try {
      await audioRef.current.play();
      playingRef.current = true;
      setPlaying(true);
    } catch {
      setAvailable(false);
    }
  }, [available]);

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !available) return;
    if (audio.paused) {
      await play();
    } else {
      audio.pause();
      playingRef.current = false;
      setPlaying(false);
    }
  }, [available, play]);

  return { playing, available, play, toggle };
}
