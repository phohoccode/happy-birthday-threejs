'use client';

import { Environment, Sparkles, Stars } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { memo, Suspense, useRef } from 'react';
import { Color } from 'three';
import type { AmbientLight, DirectionalLight, Fog, PointLight } from 'three';
import { QUALITY_PROFILES, type DeviceQuality } from '@/hooks/useDeviceQuality';
import type { BirthdayEffects } from '@/config/birthday';
import { Aurora } from './Aurora';
import { Balloons } from './Balloons';
import { CameraDirector } from './CameraDirector';
import { Cake } from './Cake';
import { Fireworks } from './Fireworks';
import { FpsGuard } from './FpsGuard';
import { MemoryUniverse3D } from './MemoryUniverse3D';
import { Portal } from './Portal';
import { WarpTunnel } from './WarpTunnel';
import { WorldDecor } from './WorldDecor';
import type { CinematicScene } from './scene-types';

const COOL = new Color('#715d9b');
const WARM = new Color('#ffc678');

function SceneLighting({ scene }: { scene: CinematicScene }) {
  const ambient = useRef<AmbientLight>(null);
  const key = useRef<DirectionalLight>(null);
  const accent = useRef<PointLight>(null);
  const fog = useRef<Fog>(null);
  useFrame(() => {
    const warm = scene === 'ceremony' || scene === 'blow' || scene === 'gift' || scene === 'finale';
    const bright = scene === 'world' || scene === 'fireworks' || scene === 'finale';
    if (ambient.current) {
      ambient.current.intensity += ((warm ? 0.72 : 0.42) - ambient.current.intensity) * 0.025;
      ambient.current.color.lerp(warm ? WARM : COOL, 0.02);
    }
    if (key.current) key.current.intensity += ((bright ? 2.25 : 1.05) - key.current.intensity) * 0.025;
    if (accent.current) accent.current.intensity += ((scene === 'fireworks' || scene === 'finale' ? 3.2 : 1.35) - accent.current.intensity) * 0.03;
    if (fog.current) fog.current.far += ((bright ? 19 : 14) - fog.current.far) * 0.02;
  });
  return <><fog ref={fog} attach="fog" args={['#070711', 6, 15]} /><ambientLight ref={ambient} intensity={0.42} color="#715d9b" /><directionalLight ref={key} position={[4, 7, 5]} intensity={1.2} color="#fff0cf" /><pointLight ref={accent} position={[-4, 2, 2]} intensity={1.4} color="#b189ff" distance={13} /></>;
}

function DevPerformanceStats() {
  const sample = useRef({ frames: 0, elapsed: 0, reported: false });
  useFrame(({ gl }, delta) => {
    const isDevelopment = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (!isDevelopment || sample.current.reported) return;
    sample.current.frames += 1;
    sample.current.elapsed += delta;
    if (sample.current.elapsed < 4) return;
    sample.current.reported = true;
    console.debug('[birthday-perf]', {
      fps: Math.round(sample.current.frames / sample.current.elapsed),
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
    });
  });
  return null;
}

type CosmicCanvasProps = {
  scene: CinematicScene;
  candlesOut: boolean;
  blowPhase: 'idle' | 'gust' | 'smoke' | 'boom';
  age?: number;
  quality: DeviceQuality;
  reducedMotion: boolean;
  onSlow: () => void;
  effects: BirthdayEffects;
  primaryColor: string;
  frameloop?: 'always' | 'demand' | 'never';
};

export const CosmicCanvas = memo(function CosmicCanvas({ scene, candlesOut, blowPhase, age, quality, reducedMotion, onSlow, effects, primaryColor, frameloop = 'always' }: CosmicCanvasProps) {
  const profile = QUALITY_PROFILES[quality];
  const starCount = reducedMotion ? Math.min(220, profile.stars) : profile.stars;
  const isCakeScene = ['world', 'ceremony', 'blow', 'fireworks', 'finale'].includes(scene);
  const isWorld = ['world', 'ceremony', 'blow'].includes(scene);
  const isQuietGalaxy = scene === 'memory' || scene === 'wish' || scene === 'gift';
  const showFireworks = scene === 'fireworks' || scene === 'finale';
  return (
    <Canvas className="cosmic-canvas" frameloop={frameloop} dpr={profile.dpr} camera={{ position: [0, 0.15, 9.5], fov: 40 }} gl={{ antialias: quality !== 'low', alpha: true, powerPreference: 'high-performance' }} shadows={false}>
      <SceneLighting scene={scene} />
      <Suspense fallback={null}>
        {scene === 'portal' ? <Portal quality={quality} reducedMotion={reducedMotion} /> : null}
        {scene === 'warp' ? <WarpTunnel count={profile.warp} reducedMotion={reducedMotion} /> : null}
        {scene !== 'darkness' && scene !== 'warp' ? <Stars radius={60} depth={30} count={isQuietGalaxy ? Math.round(starCount * 0.65) : starCount} factor={2.4} saturation={0.2} fade speed={reducedMotion ? 0 : 0.35} /> : null}
        {isWorld || isQuietGalaxy ? <Sparkles count={reducedMotion ? Math.min(16, profile.sparkles) : profile.sparkles} scale={[10, 7, 5]} size={1.7} speed={reducedMotion ? 0 : 0.16} color={primaryColor} opacity={isQuietGalaxy ? 0.18 : 0.32} /> : null}
        {isCakeScene ? <><group scale={quality === 'low' ? 0.78 : 1}><Cake age={age} candlesOut={candlesOut} ceremony={scene === 'ceremony' || scene === 'blow' || scene === 'fireworks' || scene === 'finale'} blowPhase={blowPhase} reducedMotion={reducedMotion} /></group>{isWorld && effects.balloons ? <Balloons reducedMotion={reducedMotion} /> : null}<WorldDecor reducedMotion={reducedMotion} />{isWorld && effects.aurora && quality !== 'low' ? <Aurora reducedMotion={reducedMotion} /> : null}</> : null}
        {effects.memoryGalaxy && scene === 'memory' ? <MemoryUniverse3D quality={quality} reducedMotion={reducedMotion} /> : null}
        <Fireworks active={effects.fireworks && showFireworks} finale={scene === 'finale'} reducedMotion={reducedMotion} quality={quality} />
        {quality === 'high' && isCakeScene ? <Environment preset="night" /> : null}
      </Suspense>
      <CameraDirector scene={scene} reducedMotion={reducedMotion} />
      <FpsGuard onSlow={onSlow} />
      <DevPerformanceStats />
    </Canvas>
  );
});
