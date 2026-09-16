'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BirthdayWish } from '@/lib/supabase/birthday-pages';
import { getBirthdayWishes, submitBirthdayWish, subscribeToBirthdayWishes } from '@/lib/supabase/birthday-pages';

export const WISH_LIMIT = 100;
export const WISH_COOLDOWN_MS = 15_000;

export const PREVIEW_WISHES: BirthdayWish[] = [
  { id: 'preview-wish-1', author_name: 'Minh', message: 'Chúc bạn luôn vui vẻ và gặp thật nhiều may mắn!', created_at: '2026-09-16T09:00:00.000Z' },
  { id: 'preview-wish-2', author_name: 'Lan', message: 'Tuổi mới thật nhiều bình yên, niềm vui và những điều bất ngờ thật đẹp.', created_at: '2026-09-16T08:00:00.000Z' },
  { id: 'preview-wish-3', author_name: 'Một người thương', message: 'Mong nụ cười của bạn luôn là vì sao sáng nhất trên bầu trời này.', created_at: '2026-09-16T07:00:00.000Z' },
];

function getVisitorId() {
  try {
    const key = 'birthday-wish-visitor-id';
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const next = crypto.randomUUID();
    window.localStorage.setItem(key, next);
    return next;
  } catch {
    return null;
  }
}

export function useBirthdayWishes({ slug, birthdayId, enabled, previewMode = false, ready = true }: {
  slug?: string;
  birthdayId?: string;
  enabled: boolean;
  previewMode?: boolean;
  ready?: boolean;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cooldownRef = useRef(0);
  const [started, setStarted] = useState(previewMode);
  const [wishes, setWishes] = useState<BirthdayWish[]>(previewMode ? PREVIEW_WISHES : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownNow, setCooldownNow] = useState(0);

  useEffect(() => {
    if (!ready || previewMode || !enabled) return;
    const target = sectionRef.current;
    if (!target) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setStarted(true);
        observer.disconnect();
      }
    }, { rootMargin: '720px 0px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled, previewMode, ready]);

  useEffect(() => {
    if (!cooldownUntil) return;
    const timer = window.setTimeout(() => setCooldownUntil(0), Math.max(0, cooldownUntil - Date.now()));
    return () => window.clearTimeout(timer);
  }, [cooldownUntil]);

  useEffect(() => {
    if (!cooldownUntil) return;
    const timer = window.setInterval(() => setCooldownNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  useEffect(() => {
    if (!started || !enabled || previewMode || !slug) return;
    let active = true;
    let stopRealtime: (() => void) | undefined;
    const initTimer = window.setTimeout(() => { setLoading(true); setError(null); }, 0);
    getBirthdayWishes(slug)
      .then((next) => {
        if (!active) return;
        setWishes(next.slice(0, WISH_LIMIT));
        if (birthdayId) {
          stopRealtime = subscribeToBirthdayWishes(birthdayId, (change) => {
            if (!active) return;
            setWishes((current) => {
              if (change.type === 'remove') return current.filter((wish) => wish.id !== change.id);
              if (current.some((wish) => wish.id === change.wish.id)) return current;
              return [change.wish, ...current].slice(0, WISH_LIMIT);
            });
          });
        }
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : 'Không thể tải lời chúc lúc này.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      window.clearTimeout(initTimer);
      stopRealtime?.();
    };
  }, [birthdayId, enabled, previewMode, slug, started]);

  const submit = useCallback(async (authorName: string, message: string) => {
    if (previewMode) {
      const wish: BirthdayWish = { id: `preview-${crypto.randomUUID()}`, author_name: authorName.trim(), message: message.trim(), created_at: new Date().toISOString() };
      setWishes((current) => [wish, ...current].slice(0, WISH_LIMIT));
      setLastAddedId(wish.id);
      return wish;
    }
    if (!slug) throw new Error('Lời chúc chỉ khả dụng trên trang đã xuất bản.');
    if (cooldownRef.current > Date.now()) throw new Error('Bạn có thể gửi lời chúc tiếp theo sau ít phút nữa.');
    const wish = await submitBirthdayWish(slug, authorName, message, getVisitorId());
    cooldownRef.current = Date.now() + WISH_COOLDOWN_MS;
    setCooldownNow(Date.now());
    setCooldownUntil(cooldownRef.current);
    setWishes((current) => current.some((item) => item.id === wish.id) ? current : [wish, ...current].slice(0, WISH_LIMIT));
    setLastAddedId(wish.id);
    return wish;
  }, [previewMode, slug]);

  return {
    sectionRef,
    wishes,
    loading,
    error,
    submit,
    lastAddedId,
    cooldownMs: Math.max(0, cooldownUntil - cooldownNow),
    isPreview: previewMode,
  };
}
