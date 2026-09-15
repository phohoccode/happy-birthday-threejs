'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { birthdayConfig } from '@/config/birthday';
import { useAudio } from '@/hooks/useAudio';
import { useDeviceQuality, type DeviceQuality } from '@/hooks/useDeviceQuality';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ConfettiCanvas } from './ConfettiCanvas';
import { FinalScene } from './FinalScene';
import { GiftBox } from './GiftBox';
import { IntroScene } from './IntroScene';
import { LoadingScreen } from './LoadingScreen';
import { MagicTrailCanvas } from './MagicTrailCanvas';
import { MemoryGalaxy } from './MemoryGalaxy';
import { MusicController } from './MusicController';
import { QualityController } from './QualityController';
import { WishSection } from './WishSection';
import type { CinematicScene } from './scene-types';

const STORY = [
  'Có thể hôm nay chỉ là một ngày trong 365 ngày...',
  'Nhưng với những người yêu quý bạn...',
  'Đây là một ngày rất đặc biệt.',
];
const LazyCosmicCanvas = lazy(() => import('./CosmicCanvas').then((module) => ({ default: module.CosmicCanvas })));

export function BirthdayExperience() {
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState(false);
  const [scene, setScene] = useState<CinematicScene>('darkness');
  const [ceremonyReady, setCeremonyReady] = useState(false);
  const [candlesOut, setCandlesOut] = useState(false);
  const [blowPhase, setBlowPhase] = useState<'idle' | 'gust' | 'smoke' | 'boom'>('idle');
  const [burstKey, setBurstKey] = useState(0);
  const detectedQuality = useDeviceQuality();
  const [quality, setQuality] = useState<DeviceQuality>('medium');
  const reducedMotion = useReducedMotion();
  const audio = useAudio(birthdayConfig.music);
  const { fadeTo, play, reset, toggle } = audio;
  const timelineTimers = useRef<number[]>([]);
  const finaleBurstDone = useRef(false);

  useEffect(() => { const frame = requestAnimationFrame(() => setQuality(detectedQuality)); return () => cancelAnimationFrame(frame); }, [detectedQuality]);
  useEffect(() => { const frame = requestAnimationFrame(() => setHydrated(true)); return () => cancelAnimationFrame(frame); }, []);
  useEffect(() => () => timelineTimers.current.forEach(window.clearTimeout), []);

  const finishLoading = useCallback(() => setLoading(false), []);
  const later = useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, reducedMotion ? Math.min(delay, 160) : delay);
    timelineTimers.current.push(timer);
  }, [reducedMotion]);

  const openExperience = () => {
    setOpened(true);
    setScene('portal');
    document.body.classList.add('experience-open');
    const timeline = birthdayConfig.cinematicTimeline;
    later(() => setScene('warp'), timeline.warp * 1000);
    later(() => setScene('world'), timeline.worldReveal * 1000);
    later(() => setScene('ceremony'), timeline.cakeReveal * 1000);
    later(() => setCeremonyReady(true), timeline.candle * 1000);
    void play();
  };

  useEffect(() => {
    if (scene === 'ceremony') return fadeTo(0.13, 900);
    if (scene === 'fireworks' || scene === 'finale') return fadeTo(0.4, 700);
    return undefined;
  }, [fadeTo, scene]);

  useEffect(() => {
    const locked = opened && (scene === 'portal' || scene === 'warp');
    document.body.style.overflow = locked ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [opened, scene]);

  useEffect(() => {
    if (!candlesOut) return;
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-cinematic-scene]'));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      const next = visible?.target.getAttribute('data-cinematic-scene') as CinematicScene | null;
      if (next) {
        setScene(next);
        if (next === 'finale' && !finaleBurstDone.current) {
          finaleBurstDone.current = true;
          setBurstKey((value) => value + 1);
        }
      }
    }, { rootMargin: '-30% 0px -35%', threshold: [0.1, 0.35, 0.65] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [candlesOut]);

  const blowCandles = () => {
    if (candlesOut || blowPhase !== 'idle') return;
    setScene('blow');
    setBlowPhase('gust');
    navigator.vibrate?.(20);
    later(() => { setCandlesOut(true); setBlowPhase('smoke'); }, 650);
    later(() => fadeTo(0, 180), 920);
    later(() => { setBlowPhase('boom'); setScene('fireworks'); setBurstKey((value) => value + 1); fadeTo(0.4, 420); }, 1220);
  };

  const resetExperience = () => {
    timelineTimers.current.forEach(window.clearTimeout);
    timelineTimers.current = [];
    reset();
    setOpened(false);
    setScene('darkness');
    setCandlesOut(false);
    setCeremonyReady(false);
    setBlowPhase('idle');
    finaleBurstDone.current = false;
    document.body.classList.remove('experience-open');
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const reviewMemories = () => document.querySelector('#memories')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  const downgradeQuality = useCallback(() => setQuality((current) => current === 'high' ? 'medium' : 'low'), []);

  if (!hydrated) return <main className="birthday-experience" suppressHydrationWarning />;

  return (
    <main className={`birthday-experience scene-${scene}`}>
      <div className={`world-layer ${opened ? 'is-open' : ''}`} aria-hidden="true">
        {!loading ? <Suspense fallback={null}><LazyCosmicCanvas scene={scene} candlesOut={candlesOut} blowPhase={blowPhase} age={birthdayConfig.age} quality={quality} reducedMotion={reducedMotion} onSlow={downgradeQuality} /></Suspense> : null}
      </div>
      <div className="ambient-vignette" aria-hidden="true" />
      <MagicTrailCanvas active={!loading && opened && !reducedMotion} />
      {loading ? <LoadingScreen onReady={finishLoading} /> : null}
      {!loading && !opened ? <IntroScene name={birthdayConfig.name} intro={birthdayConfig.intro} onOpen={openExperience} /> : null}
      {opened ? <div className="experience-controls"><MusicController playing={audio.playing} available={audio.available} onToggle={toggle} /><QualityController quality={quality} onChange={setQuality} /></div> : null}
      <ConfettiCanvas burstKey={burstKey} />

      {opened && (scene === 'portal' || scene === 'warp') ? (
        <div className={`opening-transition ${scene}`} aria-live="polite">
          {scene === 'portal' ? <><span className="portal-flare" /><p>Bước qua một chút phép màu...</p></> : <div className="warp-copy"><p>365 ngày nữa đã trôi qua...</p><p>Và hôm nay...</p><p>là một ngày rất đặc biệt.</p></div>}
        </div>
      ) : null}
      <div className="world-flash" aria-hidden="true" />

      <section className="hero-section content-section" aria-labelledby="hero-title">
        <div className="hero-copy">
          <motion.span initial={{ opacity: 0 }} animate={scene === 'world' || scene === 'ceremony' ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 0.2 }} className="eyebrow">{birthdayConfig.birthday} · một ngày thật đẹp</motion.span>
          <motion.h1 id="hero-title" initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={scene === 'world' || scene === 'ceremony' ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 30, filter: 'blur(10px)' }} transition={{ duration: 1.15 }}>
            <span>Happy Birthday</span><em>{birthdayConfig.name}</em>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={scene === 'world' || scene === 'ceremony' ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 0.65 }}>Hôm nay, mọi vì sao đều sáng hơn một chút.</motion.p>
        </div>
        {scene === 'ceremony' || scene === 'blow' ? <div className={`candle-prompt ${ceremonyReady ? 'is-ready' : ''}`}><span><Sparkles aria-hidden="true" /> {ceremonyReady ? 'Và ước một điều ✨' : 'Nhắm mắt lại một chút...'}</span>{ceremonyReady ? <Button className="primary-cta" size="lg" onClick={blowCandles} disabled={blowPhase !== 'idle'}>{candlesOut ? 'Điều ước đã được gửi' : 'Thổi nến'}</Button> : null}</div> : null}
      </section>

      {scene === 'fireworks' ? <div className="celebration-overlay" aria-live="polite"><span>HAPPY BIRTHDAY</span><h2>{birthdayConfig.name}</h2><p>Điều ước đã bay vào vũ trụ.</p><button type="button" onClick={reviewMemories}>Đi vào những ký ức <i /></button></div> : null}

      {candlesOut ? <section className="firework-message content-section" data-cinematic-scene="fireworks" aria-label="Bản giao hưởng pháo hoa"><span>FIREWORK SYMPHONY</span><h2>Một bầu trời dành riêng cho bạn.</h2><p>Trái · giữa · phải · rồi cả bầu trời cùng bừng sáng.</p></section> : null}
      <MemoryGalaxy memories={birthdayConfig.memories} />
      <GiftBox message={birthdayConfig.secretMessage} onOpen={() => { setBurstKey((value) => value + 1); navigator.vibrate?.(24); }} />
      <section className="story-section content-section" data-cinematic-scene="wish" aria-label="Câu chuyện dành cho bạn">{STORY.map((line, index) => <motion.p key={line} initial={{ opacity: 0.08, y: 36, filter: 'blur(10px)', scale: 0.97 }} whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }} viewport={{ amount: 0.72 }} transition={{ duration: reducedMotion ? 0.1 : 0.85, ease: [0.65, 0, 0.35, 1] }} className={index === STORY.length - 1 ? 'story-accent' : ''}>{line}</motion.p>)}</section>
      <WishSection name={birthdayConfig.name} wishes={birthdayConfig.wishes} />
      <FinalScene name={birthdayConfig.name} onReplay={resetExperience} onMemories={reviewMemories} />
    </main>
  );
}
