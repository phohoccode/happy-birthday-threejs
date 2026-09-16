'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Matrix4, Vector3 } from 'three';
import type { InstancedMesh, Mesh } from 'three';
import type { BirthdayWish } from '@/lib/supabase/birthday-pages';

type GalaxyStar = BirthdayWish & {
  position: [number, number, number];
  size: number;
  phase: number;
  twinkleSpeed: number;
};

const MAX_STARS = 100;
const SPAWN_DURATION = 1.8;
const START_POSITION = new Vector3(0, -3.3, 2.5);

function seedFromId(id: string) {
  let hash = 2_166_136_261;
  for (let index = 0; index < id.length; index += 1) hash = Math.imul(hash ^ id.charCodeAt(index), 16_777_619);
  return () => {
    hash += hash << 13;
    hash ^= hash >>> 7;
    hash += hash << 3;
    hash ^= hash >>> 17;
    hash += hash << 5;
    return (hash >>> 0) / 4_294_967_295;
  };
}

function createStar(wish: BirthdayWish): GalaxyStar {
  const random = seedFromId(wish.id);
  const theta = random() * Math.PI * 2;
  const phi = Math.acos(2 * random() - 1);
  const radius = 2.8 + random() * 2.5;
  return {
    ...wish,
    position: [Math.sin(phi) * Math.cos(theta) * radius, Math.cos(phi) * radius * 0.62, -1.7 + Math.sin(phi) * Math.sin(theta) * radius * 0.44],
    size: 0.72 + random() * 0.55,
    phase: random() * Math.PI * 2,
    twinkleSpeed: 0.6 + random() * 1.1,
  };
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

export function WishGalaxy({ wishes, newWishId, reducedMotion, onSelect }: {
  wishes: readonly BirthdayWish[];
  newWishId: string | null;
  reducedMotion: boolean;
  onSelect: (wish: BirthdayWish) => void;
}) {
  const stars = useMemo(() => wishes.slice(0, MAX_STARS).map(createStar), [wishes]);
  const meshRef = useRef<InstancedMesh>(null);
  const trailRef = useRef<Mesh>(null);
  const hoveredRef = useRef<number | null>(null);
  const spawnTimesRef = useRef(new Map<string, number>());
  const tempPosition = useMemo(() => new Vector3(), []);
  const tempScale = useMemo(() => new Vector3(), []);
  const trailTarget = useMemo(() => new Vector3(), []);
  const tempMatrix = useMemo(() => new Matrix4(), []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const now = clock.elapsedTime;
    if (newWishId && !spawnTimesRef.current.has(newWishId)) spawnTimesRef.current.set(newWishId, now);
    stars.forEach((star, index) => {
      const bornAt = spawnTimesRef.current.get(star.id);
      const progress = bornAt === undefined || reducedMotion ? 1 : Math.min(1, Math.max(0, (now - bornAt) / SPAWN_DURATION));
      const eased = easeOutCubic(progress);
      tempPosition.set(...star.position);
      if (progress < 1) tempPosition.lerpVectors(START_POSITION, tempPosition, eased);
      const twinkle = reducedMotion ? 1 : 1 + Math.sin(now * star.twinkleSpeed + star.phase) * 0.12;
      const hovered = hoveredRef.current === index ? 1.3 : 1;
      const scale = star.size * twinkle * hovered * (progress < 1 ? 0.1 + eased * 1.15 : 1);
      tempScale.setScalar(scale);
      tempMatrix.compose(tempPosition, mesh.quaternion, tempScale);
      mesh.setMatrixAt(index, tempMatrix);
    });
    mesh.instanceMatrix.needsUpdate = true;

    const trail = trailRef.current;
    if (!trail || !newWishId) return;
    const starIndex = stars.findIndex((star) => star.id === newWishId);
    const bornAt = spawnTimesRef.current.get(newWishId);
    if (starIndex < 0 || bornAt === undefined) { trail.visible = false; return; }
    const progress = reducedMotion ? 1 : Math.min(1, Math.max(0, (now - bornAt) / SPAWN_DURATION));
    if (progress >= 1) { trail.visible = false; return; }
    trail.visible = true;
    const star = stars[starIndex];
    const eased = easeOutCubic(progress);
    trailTarget.set(...star.position);
    trail.position.lerpVectors(START_POSITION, trailTarget, eased);
    trail.scale.setScalar(0.25 + (1 - progress) * 0.9);
    const material = trail.material;
    if ('opacity' in material) material.opacity = 0.35 + (1 - progress) * 0.65;
  });

  const handlePointer = (event: ThreeEvent<PointerEvent>, index: number) => {
    event.stopPropagation();
    if (typeof event.instanceId === 'number' && stars[event.instanceId]) onSelect(stars[event.instanceId]);
    else if (stars[index]) onSelect(stars[index]);
  };

  if (!stars.length) return null;
  return (
    <group position={[0, 0, -1.5]}>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, stars.length]}
        onPointerDown={(event) => handlePointer(event, event.instanceId ?? 0)}
        onPointerOver={(event) => { event.stopPropagation(); hoveredRef.current = event.instanceId ?? null; document.body.style.cursor = 'pointer'; }}
        onPointerOut={(event) => { event.stopPropagation(); hoveredRef.current = null; document.body.style.cursor = ''; }}
      >
        <sphereGeometry args={[0.13, 8, 8]} />
        <meshStandardMaterial color="#f7d774" emissive="#f7d774" emissiveIntensity={1.4} transparent opacity={0.95} toneMapped={false} />
      </instancedMesh>
      <mesh ref={trailRef} visible={false}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color="#fff5c4" transparent opacity={0.9} toneMapped={false} />
      </mesh>
    </group>
  );
}
