'use client';
/* oxlint-disable next/no-img-element -- Static-export gallery uses pre-sized local artwork. */

import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { Memory } from '@/config/birthday';

export function MemoryGalaxy({ memories }: { memories: readonly Memory[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const touchStart = useRef(0);
  const step = useCallback((direction: number) => setSelected((value) => value === null ? null : (value + direction + memories.length) % memories.length), [memories.length]);

  useEffect(() => {
    if (selected === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') step(-1);
      if (event.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, step]);

  return (
    <section className="memories-section content-section" id="memories" data-cinematic-scene="memory" aria-labelledby="memories-title">
      <div className="section-heading">
        <span>02 · Những mảnh thời gian</span>
        <h2 id="memories-title">Our Memories</h2>
        <p>Một dải ký ức nhỏ, vẫn đang lấp lánh ở đâu đó.</p>
      </div>
      <div className="memory-orbit">
        <svg className="constellation-lines" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
          <path d="M120 270 C 290 70, 410 95, 500 190 S 760 240, 885 360" />
          <path d="M500 190 C 510 320, 420 410, 350 520" />
        </svg>
        {memories.map((memory, index) => (
          <button
            type="button"
            className={`memory-card memory-card-${index + 1}`}
            key={memory.src}
            onClick={() => setSelected(index)}
            aria-label={`Mở ảnh: ${memory.caption}`}
          >
            <img src={memory.src} alt={memory.alt} loading="lazy" width="768" height="960" />
            <span><em>0{index + 1}</em>{memory.caption}<Expand aria-hidden="true" /></span>
          </button>
        ))}
      </div>
      <div className="constellation-heart" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><span /></div>
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        {selected !== null ? (
          <DialogContent
            className="memory-dialog"
            onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? 0; }}
            onTouchEnd={(event) => {
              const distance = (event.changedTouches[0]?.clientX ?? 0) - touchStart.current;
              if (Math.abs(distance) > 48) step(distance > 0 ? -1 : 1);
            }}
          >
            <DialogTitle className="sr-only">Kỷ niệm {selected + 1}</DialogTitle>
            <img src={memories[selected].src} alt={memories[selected].alt} width="768" height="960" />
            <DialogDescription>{memories[selected].caption}</DialogDescription>
            <Button variant="ghost" size="icon-lg" className="memory-nav memory-prev" onClick={() => step(-1)} aria-label="Ảnh trước"><ChevronLeft /></Button>
            <Button variant="ghost" size="icon-lg" className="memory-nav memory-next" onClick={() => step(1)} aria-label="Ảnh sau"><ChevronRight /></Button>
          </DialogContent>
        ) : null}
      </Dialog>
    </section>
  );
}
