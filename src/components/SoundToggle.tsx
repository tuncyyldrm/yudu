'use client';

import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '@/lib/sound';

export function SoundToggle({ className = '' }: { className?: string }) {
  const [muted, setMuted] = useState<boolean>(() => soundManager.isMuted());

  const handleToggle = () => {
    const next = soundManager.toggleMute();
    setMuted(next);
    if (!next) {
      soundManager.playClick();
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all active:scale-95 flex items-center justify-center ${className}`}
      title={muted ? 'Sesi Aç' : 'Sesi Kapat'}
      aria-label={muted ? 'Sesi Aç' : 'Sesi Kapat'}
    >
      {muted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
    </button>
  );
}
