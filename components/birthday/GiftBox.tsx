'use client';

import { Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function GiftBox({ message, onOpen }: { message: string; onOpen: () => void }) {
  const [stage, setStage] = useState(0);
  const timers = useRef<number[]>([]);
  const opened = stage > 0;
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  const reveal = () => {
    if (opened) return;
    setStage(1);
    timers.current.push(window.setTimeout(() => setStage(2), 450));
    timers.current.push(window.setTimeout(() => setStage(3), 900));
    timers.current.push(window.setTimeout(() => { setStage(4); onOpen(); }, 1280));
  };
  return (
    <section className={`gift-section content-section gift-stage-${stage}`} data-cinematic-scene="gift" aria-labelledby="gift-title">
      <div className="section-heading centered">
        <span>Khoan đã...</span>
        <h2 id="gift-title">Vẫn còn một thứ nữa.</h2>
      </div>
      <button className={`gift-box ${stage >= 3 ? 'is-open' : ''}`} onClick={reveal} type="button" aria-label="Mở hộp quà bí mật" aria-expanded={opened}>
        <span className="gift-light" aria-hidden="true" />
        <span className="gift-lid"><i /></span>
        <span className="gift-body"><i /></span>
        <span className="gift-shadow" />
        <span className="heart-particles" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</span>
      </button>
      <div className={`secret-message ${stage >= 4 ? 'is-visible' : ''}`} aria-live="polite">
        <Sparkles aria-hidden="true" />
        <p>{message}</p>
      </div>
    </section>
  );
}
