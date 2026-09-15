'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Vector3 } from 'three';
import type { CinematicScene } from './scene-types';

const CAMERA_STATES: Record<CinematicScene, { position: Vector3; target: Vector3; fov: number; speed: number }> = {
  darkness: { position: new Vector3(0, 0, 10), target: new Vector3(0, 0, 0), fov: 38, speed: 0.025 },
  portal: { position: new Vector3(0, 0, 7.4), target: new Vector3(0, 0, 0), fov: 46, speed: 0.035 },
  warp: { position: new Vector3(0, 0, 3.8), target: new Vector3(0, 0, -8), fov: 68, speed: 0.075 },
  world: { position: new Vector3(0, 0.3, 8.2), target: new Vector3(0, 0, 0), fov: 44, speed: 0.022 },
  ceremony: { position: new Vector3(0, 0.15, 6.1), target: new Vector3(0, 0.45, 0), fov: 38, speed: 0.03 },
  blow: { position: new Vector3(0, 0.55, 5.35), target: new Vector3(0, 0.75, 0), fov: 34, speed: 0.045 },
  fireworks: { position: new Vector3(0, 0.55, 9.4), target: new Vector3(0, 1.1, -1), fov: 54, speed: 0.045 },
  memory: { position: new Vector3(-0.9, 0.6, 8.7), target: new Vector3(0.4, 0.2, -1), fov: 48, speed: 0.018 },
  gift: { position: new Vector3(0, 0.4, 6.7), target: new Vector3(0, 0.25, 0), fov: 39, speed: 0.025 },
  wish: { position: new Vector3(0.7, 0.8, 9.4), target: new Vector3(0, 0, -1), fov: 46, speed: 0.014 },
  finale: { position: new Vector3(0, 1.25, 11.2), target: new Vector3(0, 0.6, -1), fov: 55, speed: 0.026 },
};

export function CameraDirector({ scene, reducedMotion }: { scene: CinematicScene; reducedMotion: boolean }) {
  const target = useRef(new Vector3());

  useFrame(({ camera, pointer, clock, size }) => {
    const state = CAMERA_STATES[scene];
    const mobileOffset = size.width < 700
      ? scene === 'portal' ? 2.7 : scene === 'world' ? 3.1 : scene === 'ceremony' || scene === 'blow' ? 3.5 : scene === 'fireworks' || scene === 'finale' ? 2.6 : 0
      : 0;
    const drift = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 0.36) * 0.025;
    const pointerX = reducedMotion ? 0 : pointer.x * 0.1;
    const pointerY = reducedMotion ? 0 : pointer.y * 0.07;
    camera.position.x += (state.position.x + pointerX + drift - camera.position.x) * state.speed;
    camera.position.y += (state.position.y + pointerY + drift * 0.5 - camera.position.y) * state.speed;
    camera.position.z += (state.position.z + mobileOffset - camera.position.z) * state.speed;
    target.current.lerp(state.target, state.speed * 1.15);
    camera.lookAt(target.current);
    if ('fov' in camera) {
      camera.fov += (state.fov - camera.fov) * state.speed;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}
