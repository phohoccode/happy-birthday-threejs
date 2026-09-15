'use client';

import { Images, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FinalScene({ name, onReplay, onMemories }: { name: string; onReplay: () => void; onMemories: () => void }) {
  return (
    <footer className="final-scene content-section" data-cinematic-scene="finale">
      <div className="shooting-star" aria-hidden="true" />
      <span className="final-kicker">one more trip around the sun</span>
      <h2>Happy Birthday, {name}.</h2>
      <p>May this year be full of beautiful surprises.</p>
      <div className="final-divider"><span /></div>
      <small>Made with love, just for you.</small>
      <div className="final-actions"><Button className="secondary-cta" variant="outline" size="lg" onClick={onReplay}><RotateCcw aria-hidden="true" /> Xem lại từ đầu</Button><Button className="secondary-cta" variant="outline" size="lg" onClick={onMemories}><Images aria-hidden="true" /> Xem lại kỷ niệm</Button></div>
    </footer>
  );
}
