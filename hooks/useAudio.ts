'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useAudio(src?: string, volume = 0.35) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [failedSrc, setFailedSrc] = useState<string | undefined>();
  const available = Boolean(src) && failedSrc !== src;

  useEffect(() => {
    if (!src) {
      audioRef.current = null;
      return;
    }
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.35;
    audio.preload = 'none';
    const handleError = () => setFailedSrc(src);
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

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(1, volume));
  }, [volume]);

  const play = useCallback(async () => {
    if (!audioRef.current || !available) return;
    try {
      await audioRef.current.play();
      playingRef.current = true;
      setPlaying(true);
    } catch {
      setFailedSrc(src);
    }
  }, [available, src]);

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

  const fadeTo = useCallback((target: number, duration = 500) => {
    const audio = audioRef.current;
    if (!audio) return () => undefined;
    const from = audio.volume;
    const started = performance.now();
    let timer = 0;
    timer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - started) / Math.max(1, duration));
      audio.volume = from + (Math.max(0, Math.min(1, target)) - from) * progress;
      if (progress >= 1) window.clearInterval(timer);
    }, 16);
    return () => window.clearInterval(timer);
  }, []);

  const reset = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    audio.volume = volume;
    playingRef.current = false;
    setPlaying(false);
  }, [volume]);

  return { playing, available, play, toggle, fadeTo, reset };
}
