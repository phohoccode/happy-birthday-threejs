'use client';

import { Gift, LoaderCircle, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatCountdown, formatUnlockAt, getRemainingMs } from '@/lib/unlock';

const COUNTDOWN_UNITS = [
  ['days', 'NGÀY'],
  ['hours', 'GIỜ'],
  ['minutes', 'PHÚT'],
  ['seconds', 'GIÂY'],
] as const;

export function ScheduledUnlockScreen({ recipientName, unlockAt, timeZone, onOpen }: {
  recipientName: string;
  unlockAt: string;
  timeZone: string;
  onOpen: () => Promise<void>;
}) {
  const [remainingMs, setRemainingMs] = useState(() => getRemainingMs(unlockAt) ?? 0);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const display = useMemo(() => formatUnlockAt(unlockAt, timeZone), [timeZone, unlockAt]);
  const countdown = formatCountdown(remainingMs);
  const ready = remainingMs <= 0;

  useEffect(() => {
    const tick = () => setRemainingMs(getRemainingMs(unlockAt) ?? 0);
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [unlockAt]);

  const handleOpen = async () => {
    if (!ready || opening) return;
    setOpening(true);
    setError(null);
    try {
      await onOpen();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Món quà chưa thể mở lúc này.');
    } finally {
      setOpening(false);
    }
  };

  return (
    <main className="scheduled-unlock-screen">
      <div className="scheduled-unlock-stars" aria-hidden="true" />
      <div className="scheduled-unlock-aurora" aria-hidden="true" />
      <section className="scheduled-unlock-card" aria-labelledby="scheduled-unlock-title">
        <div className="scheduled-unlock-gift" aria-hidden="true"><Gift /><Sparkles /></div>
        <span className="scheduled-unlock-kicker">A LITTLE SURPRISE FOR {recipientName.toUpperCase()}</span>
        <h1 id="scheduled-unlock-title">Một món quà đang chờ bạn...</h1>
        <p className="scheduled-unlock-date">Sẽ mở vào <strong>{display.time} · {display.date}</strong><span>Múi giờ: {display.timeZoneLabel}</span></p>
        {!ready ? (
          <div className="scheduled-unlock-countdown" aria-live="off" aria-label={`Còn ${countdown.days} ngày ${countdown.hours} giờ ${countdown.minutes} phút ${countdown.seconds} giây`}>
            {COUNTDOWN_UNITS.map(([key, label]) => <div className="scheduled-unlock-unit" key={key}><strong>{String(countdown[key]).padStart(2, '0')}</strong><span>{label}</span></div>)}
          </div>
        ) : (
          <div className="scheduled-unlock-ready" aria-live="polite">
            <p>Đã đến lúc rồi ✨</p>
            <Button className="scheduled-unlock-open" size="lg" onClick={() => void handleOpen()} disabled={opening}>{opening ? <LoaderCircle className="spin" /> : <Gift />}{opening ? 'Đang mở...' : 'OPEN 🎁'}</Button>
          </div>
        )}
        {error ? <p className="scheduled-unlock-error" role="alert">{error}</p> : null}
        <p className="scheduled-unlock-note">Nội dung sẽ xuất hiện khi món quà thực sự được mở.</p>
      </section>
    </main>
  );
}
