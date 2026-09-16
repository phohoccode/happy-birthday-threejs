'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BirthdayConfig } from '@/config/birthday';
import { createDraft, ensureAnonymousUser, saveDraft } from '@/lib/supabase/birthday-pages';
import { getSupabaseClient } from '@/lib/supabase/client';
import { DEFAULT_UNLOCK_TIME_ZONE } from '@/lib/unlock';

export type SaveStatus = 'offline' | 'idle' | 'saving' | 'saved' | 'error';

export function useBirthdayDraft(config: BirthdayConfig, unlockAt: string | null = null, unlockTimezone = DEFAULT_UNLOCK_TIME_ZONE) {
  const configured = Boolean(getSupabaseClient());
  const [userId, setUserId] = useState<string | null>(null);
  const [pageId, setPageId] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>(configured ? 'idle' : 'offline');
  const [error, setError] = useState<string | null>(null);
  const pageIdRef = useRef<string | null>(null);
  const creatingRef = useRef<Promise<string> | null>(null);
  const saveChainRef = useRef(Promise.resolve());
  const revisionRef = useRef(0);
  const latestConfigRef = useRef(config);
  const latestUnlockAtRef = useRef(unlockAt);
  const latestUnlockTimezoneRef = useRef(unlockTimezone);

  useEffect(() => {
    latestConfigRef.current = config;
    latestUnlockAtRef.current = unlockAt;
    latestUnlockTimezoneRef.current = unlockTimezone;
  }, [config, unlockAt, unlockTimezone]);

  useEffect(() => {
    if (!configured) return;
    let active = true;
    ensureAnonymousUser()
      .then((user) => { if (active) setUserId(user?.id ?? null); })
      .catch((reason: unknown) => {
        if (!active) return;
        setStatus('error');
        setError(reason instanceof Error ? reason.message : 'Không thể bắt đầu phiên làm việc.');
      });
    return () => { active = false; };
  }, [configured]);

  const ensurePage = useCallback(async (snapshot = latestConfigRef.current, unlockSnapshot = latestUnlockAtRef.current, timezoneSnapshot = latestUnlockTimezoneRef.current) => {
    if (pageIdRef.current) return pageIdRef.current;
    if (!userId) throw new Error('Phiên ẩn danh chưa sẵn sàng.');
    if (!creatingRef.current) {
      creatingRef.current = createDraft(userId, snapshot, unlockSnapshot, timezoneSnapshot).then((page) => {
        pageIdRef.current = page.id;
        setPageId(page.id);
        return page.id;
      }).finally(() => { creatingRef.current = null; });
    }
    return creatingRef.current;
  }, [userId]);

  useEffect(() => {
    if (!configured || !userId) return;
    const revision = ++revisionRef.current;
    const timer = window.setTimeout(() => {
      setStatus('saving');
      setError(null);
      const snapshot = structuredClone(latestConfigRef.current);
      saveChainRef.current = saveChainRef.current
        .catch(() => undefined)
        .then(async () => {
          try {
            const id = await ensurePage(snapshot, unlockAt, unlockTimezone);
            await saveDraft(id, snapshot, unlockAt, unlockTimezone);
            if (revision === revisionRef.current) setStatus('saved');
          } catch (reason) {
            if (revision !== revisionRef.current) return;
            setStatus('error');
            setError(reason instanceof Error ? reason.message : 'Không thể lưu bản nháp.');
          }
        });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [config, configured, ensurePage, unlockAt, unlockTimezone, userId]);

  const flush = useCallback(async (unlockSnapshot = latestUnlockAtRef.current, timezoneSnapshot = latestUnlockTimezoneRef.current) => {
    if (!configured) throw new Error('Hãy thêm biến môi trường Supabase trước khi xuất bản.');
    setStatus('saving');
    const snapshot = structuredClone(latestConfigRef.current);
    await saveChainRef.current.catch(() => undefined);
    const id = await ensurePage(snapshot, unlockSnapshot, timezoneSnapshot);
    await saveDraft(id, snapshot, unlockSnapshot, timezoneSnapshot);
    setStatus('saved');
    return id;
  }, [configured, ensurePage]);

  return { configured, userId, pageId, status, error, ensurePage, flush };
}
