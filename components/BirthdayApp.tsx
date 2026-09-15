'use client';

import { ArrowLeft, LoaderCircle, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BirthdayExperience } from '@/components/birthday/BirthdayExperience';
import { BirthdayCreator } from '@/components/creator/BirthdayCreator';
import { Button } from '@/components/ui/button';
import type { BirthdayConfig } from '@/config/birthday';
import { getPublishedBirthday } from '@/lib/supabase/birthday-pages';

type ViewerState =
  | { mode: 'creator' }
  | { mode: 'loading' }
  | { mode: 'birthday'; config: BirthdayConfig }
  | { mode: 'not-found' };

export function BirthdayApp() {
  const [state, setState] = useState<ViewerState>({ mode: 'loading' });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('wish')?.trim();
    const localPreview = params.get('preview') === '1';

    if (localPreview) {
      try {
        const stored = window.sessionStorage.getItem('birthday-creator-preview');
        if (stored) {
          queueMicrotask(() => setState({ mode: 'birthday', config: JSON.parse(stored) as BirthdayConfig }));
          return;
        }
      } catch { /* Fall through to the creator when preview state is unavailable. */ }
    }

    if (!slug) {
      queueMicrotask(() => setState({ mode: 'creator' }));
      return;
    }

    let active = true;
    getPublishedBirthday(slug)
      .then((page) => {
        if (!active) return;
        setState(page ? { mode: 'birthday', config: page.published_config } : { mode: 'not-found' });
      })
      .catch(() => {
        if (!active) return;
        setState({ mode: 'not-found' });
      });
    return () => { active = false; };
  }, []);

  if (state.mode === 'creator') return <BirthdayCreator />;
  if (state.mode === 'birthday') return <BirthdayExperience config={state.config} />;
  if (state.mode === 'loading') return <main className="public-state"><LoaderCircle className="spin" /><p>Đang gom những vì sao...</p></main>;

  return (
    <main className="public-state public-not-found">
      <div className="not-found-orbit" aria-hidden="true"><i /><i /><i /></div>
      <Sparkles />
      <span>404 · Lạc giữa ngân hà</span>
      <h1>Điều ước này chưa xuất hiện.</h1>
      <p>Liên kết có thể chưa được xuất bản hoặc không còn tồn tại.</p>
      <Button onClick={() => { window.location.href = '/'; }}><ArrowLeft /> Tạo một trang sinh nhật</Button>
    </main>
  );
}
