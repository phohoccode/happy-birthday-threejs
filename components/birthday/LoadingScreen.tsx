'use client';

import { useEffect, useState } from 'react';

export function LoadingScreen({ onReady }: { onReady: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const next = Math.min(100, Math.round(((now - started) / 1550) * 100));
      setProgress(next);
      if (next >= 100) {
        window.setTimeout(onReady, 260);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onReady]);

  return (
    <output className="loading-screen" aria-live="polite">
      <span className="loading-star" aria-hidden="true">✦</span>
      <p>Đang chuẩn bị một điều đặc biệt...</p>
      <div className="loading-track"><span style={{ width: `${progress}%` }} /></div>
      <span className="loading-value">{progress}%</span>
    </output>
  );
}
