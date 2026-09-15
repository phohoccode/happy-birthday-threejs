'use client';

import { Sparkles } from 'lucide-react';
import { useState } from 'react';

export function GiftBox({ message, onOpen }: { message: string; onOpen: () => void }) {
  const [opened, setOpened] = useState(false);
  const reveal = () => {
    if (opened) return;
    setOpened(true);
    onOpen();
  };
  return (
    <section className="gift-section content-section" aria-labelledby="gift-title">
      <div className="section-heading centered">
        <span>04 · Một điều cuối cùng</span>
        <h2 id="gift-title">Vẫn còn một món quà nữa...</h2>
      </div>
      <button className={`gift-box ${opened ? 'is-open' : ''}`} onClick={reveal} type="button" aria-label="Mở hộp quà bí mật" aria-expanded={opened}>
        <span className="gift-light" aria-hidden="true" />
        <span className="gift-lid"><i /></span>
        <span className="gift-body"><i /></span>
        <span className="gift-shadow" />
      </button>
      <div className={`secret-message ${opened ? 'is-visible' : ''}`} aria-live="polite">
        <Sparkles aria-hidden="true" />
        <p>{message}</p>
      </div>
    </section>
  );
}
