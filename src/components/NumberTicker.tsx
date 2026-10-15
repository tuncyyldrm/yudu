'use client';

import { useEffect, useState, useRef } from 'react';
import { formatGameValue } from '@/lib/format';
import { soundManager } from '@/lib/sound';

interface NumberTickerProps {
  value: number;
  unit: string;
  categoryId?: string;
  duration?: number;
  onComplete?: () => void;
  className?: string;
}

export function NumberTicker({
  value,
  unit,
  categoryId,
  duration = 900,
  onComplete,
  className = '',
}: NumberTickerProps) {
  const [currentValue, setCurrentValue] = useState<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const lastSoundRef = useRef<number>(0);
  const frameRef = useRef<number | null>(null);
  const completedRef = useRef<boolean>(false);

  useEffect(() => {
    completedRef.current = false;
    startTimeRef.current = null;
    lastSoundRef.current = 0;

    const startVal = 0;
    const targetVal = value;

    const animate = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      const elapsed = time - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutCubic curve for realistic deceleration
      const ease = 1 - Math.pow(1 - progress, 3);
      const computed = Math.round(startVal + (targetVal - startVal) * ease);

      setCurrentValue(computed);

      // Play tick sound throttled
      if (progress < 1 && time - lastSoundRef.current > 45) {
        soundManager.playTick();
        lastSoundRef.current = time;
      }

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetVal);
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration, onComplete]);

  const formatted = formatGameValue(
    { id: 'temp', name: '', value: currentValue, unit },
    categoryId
  );

  return (
    <div className={`font-mono font-black tracking-tight ${className}`}>
      {formatted}
    </div>
  );
}
