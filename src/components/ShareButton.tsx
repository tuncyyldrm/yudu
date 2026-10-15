'use client';

import { useState } from 'react';
import { Share2, Check, MessageCircle } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface ShareButtonProps {
  score: number;
  categoryTitle: string;
}

export function ShareButton({ score, categoryTitle }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `🎯 YÜDÜ'de "${categoryTitle}" kategorisinde ${score} skor yaptım! Benim rekorumu geçebilir misin? 🔥 Sen de oyna!`;

  const handleShare = async () => {
    soundManager.playClick();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'YÜDÜ - Yüksek mi Düşük mü?',
          text: shareText,
          url: window.location.href,
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
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex gap-2 w-full">
      <button
        onClick={handleShare}
        className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all active:scale-95 border border-slate-700"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Kopyalandı!</span>
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4 text-indigo-400" />
            <span>Skoru Paylaş</span>
          </>
        )}
      </button>

      <button
        onClick={openWhatsApp}
        className="flex items-center justify-center bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-800/60 p-3 rounded-xl transition-all active:scale-95"
        title="WhatsApp ile Paylaş"
      >
        <MessageCircle className="w-4 h-4" />
      </button>
    </div>
  );
}
