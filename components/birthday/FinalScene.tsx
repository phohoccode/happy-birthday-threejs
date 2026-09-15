'use client';

import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FinalScene({ name, onReplay }: { name: string; onReplay: () => void }) {
  return (
    <footer className="final-scene content-section">
      <div className="shooting-star" aria-hidden="true" />
      <span className="final-kicker">one more trip around the sun</span>
      <h2>Happy Birthday, {name}.</h2>
      <p>May this year be your best one yet.</p>
      <div className="final-divider"><span /></div>
      <small>Made with love, just for you.</small>
      <Button className="secondary-cta" variant="outline" size="lg" onClick={onReplay}>
        <RotateCcw aria-hidden="true" /> Xem lại từ đầu
      </Button>
    </footer>
  );
}
