'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import ArcanineSVG from './illustrations/ArcanineSVG';

type Mood = 'idle' | 'happy' | 'jump' | 'eat';

const PROXIMITY_THRESHOLD = 180;
const EAT_DURATION = 3000;
const JUMP_DURATION = 700;

export default function InteractiveArcanine() {
  const [mood, setMood] = useState<Mood>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const moodLockRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lockMood = useCallback((nextMood: Mood, duration: number) => {
    if (moodLockRef.current) return;
    moodLockRef.current = true;
    setMood(nextMood);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      moodLockRef.current = false;
      setMood('idle');
    }, duration);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (moodLockRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (dist < PROXIMITY_THRESHOLD) {
        setMood('happy');
      } else {
        setMood('idle');
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleClick = useCallback(() => {
    // Alternate between jump and eat on click
    const next = mood === 'eat' ? 'jump' : 'eat';
    lockMood(next, next === 'eat' ? EAT_DURATION : JUMP_DURATION);
  }, [mood, lockMood]);

  const handleDoubleClick = useCallback(() => {
    lockMood('jump', JUMP_DURATION);
  }, [lockMood]);

  return (
    <div
      className={`arcanine-wrapper arcanine--${mood}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      ref={containerRef}
      role="img"
      aria-label="Arcanine, Pokémon No. 059"
      title="Click me!"
    >
      <ArcanineSVG mood={mood} />
      {mood === 'happy' && (
        <span className="arcanine-tooltip" aria-hidden="true">
          No. 059 ♡
        </span>
      )}
      {mood === 'eat' && (
        <span className="arcanine-tooltip" aria-hidden="true">
          *chomp chomp*
        </span>
      )}
      {mood === 'jump' && (
        <span className="arcanine-tooltip" aria-hidden="true">
          Arcanine used Extreme Speed!
        </span>
      )}
    </div>
  );
}
