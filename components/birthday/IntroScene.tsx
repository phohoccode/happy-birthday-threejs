'use client';

import { Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function IntroScene({ name, intro, onOpen }: { name: string; intro: string; onOpen: () => void }) {
  return (
    <div className="intro-screen">
      <div className="intro-orbit" aria-hidden="true"><span /><span /><span /></div>
      <div className="intro-copy">
        <Sparkles className="intro-mark" aria-hidden="true" />
        <p>{intro.replace('bạn', name)}</p>
        <h1>Bạn có muốn mở nó không?</h1>
        <Button className="primary-cta" size="lg" onClick={onOpen}>
          <Gift aria-hidden="true" /> Mở món quà
        </Button>
        <span className="intro-note">Chạm để bắt đầu trải nghiệm</span>
      </div>
    </div>
  );
}
