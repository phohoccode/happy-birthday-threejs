'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { birthdayConfig } from '@/config/birthday';
import { useAudio } from '@/hooks/useAudio';
import { useDeviceQuality } from '@/hooks/useDeviceQuality';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ConfettiCanvas } from './ConfettiCanvas';
import { FinalScene } from './FinalScene';
import { GiftBox } from './GiftBox';
import { IntroScene } from './IntroScene';
import { LoadingScreen } from './LoadingScreen';
import { MemoryGalaxy } from './MemoryGalaxy';
import { MusicController } from './MusicController';
import { WishSection } from './WishSection';

const STORY = [
  'Có những người xuất hiện rất bình thường...',
  '...nhưng lại vô tình trở thành một phần rất đặc biệt.',
  'Và hôm nay...',
  'là ngày thế giới có thêm bạn.',
];

const LazyCosmicCanvas = lazy(() => import('./CosmicCanvas').then((module) => ({ default: module.CosmicCanvas })));

export function BirthdayExperience() {
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState(false);
  const [candlesOut, setCandlesOut] = useState(false);
  const [fireworks, setFireworks] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const reducedMotion = useReducedMotion();
  const quality = useDeviceQuality();
  const audio = useAudio(birthdayConfig.music);

  const finishLoading = useCallback(() => setLoading(false), []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setHydrated(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const openExperience = async () => {
    setOpened(true);
    document.body.classList.add('experience-open');
    await audio.play();
  };

  const blowCandles = () => {
    if (candlesOut) return;
    setCandlesOut(true);
    setBurstKey((value) => value + 1);
    window.setTimeout(() => setFireworks(true), reducedMotion ? 0 : 520);
  };

  const replay = () => {
    setCandlesOut(false);
    setFireworks(false);
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    let frame = 0;
    const onPointer = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--cursor-x', `${event.clientX}px`);
        document.documentElement.style.setProperty('--cursor-y', `${event.clientY}px`);
      });
    };
    window.addEventListener('pointermove', onPointer, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onPointer);
      document.body.classList.remove('experience-open');
    };
  }, []);

  if (!hydrated) return <main className="birthday-experience" suppressHydrationWarning />;

  return (
    <main className="birthday-experience">
      <div className={`world-layer ${opened ? 'is-open' : ''}`} aria-hidden="true">
        {!loading ? (
          <Suspense fallback={null}>
            <LazyCosmicCanvas opened={opened} candlesOut={candlesOut} fireworks={fireworks} age={birthdayConfig.age} quality={quality} reducedMotion={reducedMotion} />
          </Suspense>
        ) : null}
      </div>
      <div className="ambient-vignette" aria-hidden="true" />
      <div className="cursor-glow" aria-hidden="true" />
      {loading ? <LoadingScreen onReady={finishLoading} /> : null}
      {!loading && !opened ? <IntroScene name={birthdayConfig.name} intro={birthdayConfig.intro} onOpen={openExperience} /> : null}
      {opened ? <MusicController playing={audio.playing} available={audio.available} onToggle={audio.toggle} /> : null}
      <ConfettiCanvas burstKey={burstKey} />

      <section className="hero-section content-section" aria-labelledby="hero-title">
        <div className="hero-copy">
          <motion.span initial={{ opacity: 0 }} animate={opened ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 0.3 }} className="eyebrow">
            {birthdayConfig.birthday} · một ngày thật đẹp
          </motion.span>
          <motion.h1 id="hero-title" initial={{ opacity: 0, y: 24 }} animate={opened ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }} transition={{ delay: 0.5, duration: 1 }}>
            Happy Birthday<br /><em>{birthdayConfig.name}</em>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={opened ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 0.95 }}>
            Hôm nay, mọi vì sao đều sáng hơn một chút.
          </motion.p>
        </div>
        <div className="candle-prompt">
          <span><Sparkles aria-hidden="true" /> Hãy ước một điều</span>
          <Button className="primary-cta" size="lg" onClick={blowCandles} disabled={candlesOut}>
            {candlesOut ? 'Điều ước đã được gửi' : 'Thổi nến'}
          </Button>
        </div>
        <a className="scroll-cue" href="#memories"><span />Cuộn để bước vào những ký ức</a>
      </section>

      {fireworks ? (
        <section className="firework-message" aria-live="polite">
          <span>HAPPY BIRTHDAY</span>
          <h2>{birthdayConfig.name}</h2>
          <p>Chúc bạn luôn có thật nhiều lý do để mỉm cười.</p>
        </section>
      ) : null}

      <MemoryGalaxy memories={birthdayConfig.memories} />

      <section className="story-section content-section" aria-label="Câu chuyện dành cho bạn">
        {STORY.map((line, index) => (
          <motion.p key={line} initial={{ opacity: 0.12, y: 36, filter: 'blur(10px)', scale: 0.97 }} whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }} viewport={{ amount: 0.72 }} transition={{ duration: reducedMotion ? 0.1 : 0.75, ease: [0.65, 0, 0.35, 1] }} className={index === STORY.length - 1 ? 'story-accent' : ''}>
            {line}
          </motion.p>
        ))}
      </section>

      <WishSection name={birthdayConfig.name} wishes={birthdayConfig.wishes} />
      <GiftBox message={birthdayConfig.secretMessage} onOpen={() => setBurstKey((value) => value + 1)} />
      <FinalScene name={birthdayConfig.name} onReplay={replay} />
    </main>
  );
}
