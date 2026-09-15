'use client';

import { Environment, Sparkles, Stars } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { memo, Suspense, useRef } from 'react';
import { Color } from 'three';
import type { AmbientLight, DirectionalLight, Fog, PointLight } from 'three';
import type { DeviceQuality } from '@/hooks/useDeviceQuality';
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
};

export const CosmicCanvas = memo(function CosmicCanvas({ scene, candlesOut, blowPhase, age, quality, reducedMotion, onSlow, effects, primaryColor }: CosmicCanvasProps) {
  const starCount = reducedMotion ? 350 : quality === 'high' ? 1900 : quality === 'medium' ? 1050 : 520;
  const isWorld = ['world', 'ceremony', 'blow', 'fireworks', 'finale'].includes(scene);
  const isQuietGalaxy = scene === 'memory' || scene === 'wish' || scene === 'gift';
  const showFireworks = scene === 'fireworks' || scene === 'finale';
  return (
    <Canvas className="cosmic-canvas" dpr={quality === 'high' ? [1, 1.75] : quality === 'medium' ? [1, 1.4] : [0.75, 1.12]} camera={{ position: [0, 0.15, 9.5], fov: 40 }} gl={{ antialias: quality !== 'low', alpha: true, powerPreference: 'high-performance' }} shadows={false}>
      <SceneLighting scene={scene} />
      <Suspense fallback={null}>
        {scene === 'portal' ? <Portal reducedMotion={reducedMotion} /> : null}
        {scene === 'warp' ? <WarpTunnel count={quality === 'high' ? 1250 : quality === 'medium' ? 760 : 380} reducedMotion={reducedMotion} /> : null}
        {scene !== 'darkness' && scene !== 'warp' ? <Stars radius={60} depth={30} count={isQuietGalaxy ? Math.round(starCount * 0.65) : starCount} factor={2.4} saturation={0.2} fade speed={reducedMotion ? 0 : 0.35} /> : null}
        {isWorld || isQuietGalaxy ? <Sparkles count={quality === 'low' ? 30 : 68} scale={[10, 7, 5]} size={1.7} speed={reducedMotion ? 0 : 0.16} color={primaryColor} opacity={isQuietGalaxy ? 0.18 : 0.32} /> : null}
        {isWorld ? <><group scale={quality === 'low' ? 0.78 : 1}><Cake age={age} candlesOut={candlesOut} ceremony={scene === 'ceremony' || scene === 'blow' || scene === 'fireworks' || scene === 'finale'} blowPhase={blowPhase} reducedMotion={reducedMotion} /></group>{effects.balloons ? <Balloons reducedMotion={reducedMotion} /> : null}<WorldDecor reducedMotion={reducedMotion} />{effects.aurora && quality !== 'low' ? <Aurora reducedMotion={reducedMotion} /> : null}</> : null}
        {effects.memoryGalaxy && scene === 'memory' ? <MemoryUniverse3D reducedMotion={reducedMotion} /> : null}
        <Fireworks active={effects.fireworks && showFireworks} finale={scene === 'finale'} reducedMotion={reducedMotion} />
        {quality === 'high' && isWorld ? <Environment preset="night" /> : null}
      </Suspense>
      <CameraDirector scene={scene} reducedMotion={reducedMotion} />
      <FpsGuard onSlow={onSlow} />
    </Canvas>
  );
});
