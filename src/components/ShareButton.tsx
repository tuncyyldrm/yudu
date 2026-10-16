'use client';

import { useState } from 'react';
import { Check, MessageCircle, Swords } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface ShareButtonProps {
  score: number;
  categoryTitle: string;
}

export function ShareButton({ score, categoryTitle }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const getChallengeUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?target=${score}`;
  };

  const getShareText = () => {
    const challengeUrl = getChallengeUrl();
    return `⚔️ YÜDÜ "${categoryTitle}" kategorisinde ${score} skor yaptım! Benim rekorumu geçebilir misin? 🔥 Hemen tıkla ve meydan oku:\n${challengeUrl}`;
  };

  const handleShare = async () => {
    soundManager.playClick();
    const shareText = getShareText();
    const challengeUrl = getChallengeUrl();

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'YÜDÜ Meydan Okuma',
          text: shareText,
          url: challengeUrl,
        });
        return;
      } catch {
        // User cancelled or share failed, fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const openWhatsApp = () => {
    soundManager.playClick();
    const shareText = getShareText();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex gap-2 w-full">
      <button
        onClick={handleShare}
        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 text-amber-300 hover:text-amber-200 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 border border-amber-400/40 shadow-md"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-bold">Meydan Okuma Linki Kopyalandı!</span>
          </>
        ) : (
          <>
            <Swords className="w-4 h-4 text-amber-400" />
            <span>Arkadaşına Meydan Oku</span>
          </>
        )}
      </button>

      <button
        onClick={openWhatsApp}
        className="flex items-center justify-center bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-400 border border-emerald-700/60 p-3 rounded-xl transition-all active:scale-95 shadow-md"
        title="WhatsApp ile Meydan Oku"
      >
        <MessageCircle className="w-4 h-4" />
      </button>
    </div>
  );
}
