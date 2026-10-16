'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Share2, 
  Check, 
  RotateCcw, 
  Calendar, 
  Trophy,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { 
  getTodayDateString, 
  getDailyChallengeNumber, 
  getDailyChallengeItems, 
  getStoredDailyResult, 
  saveStoredDailyResult, 
  generateDailyShareText,
  DailyResult
} from '@/lib/daily';
import { formatGameValue } from '@/lib/format';
import { soundManager } from '@/lib/sound';
import { fireConfetti, fireSuperConfetti } from '@/lib/confetti';
import { SoundToggle } from '@/components/SoundToggle';

export function DailyClient() {
  const todayStr = useMemo(() => getTodayDateString(), []);
  const dayNumber = useMemo(() => getDailyChallengeNumber(todayStr), [todayStr]);
  const dailyItems = useMemo(() => getDailyChallengeItems(todayStr), [todayStr]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = getStoredDailyResult(getTodayDateString());
    return stored ? stored.results : [];
  });
  const [isRevealing, setIsRevealing] = useState(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = getStoredDailyResult(getTodayDateString());
    return !!stored;
  });
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeftToTomorrow, setTimeLeftToTomorrow] = useState('');
  const [isPractice, setIsPractice] = useState(false);

  // Countdown timer to midnight UTC+3 (tomorrow)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const diff = Math.max(0, tomorrow.getTime() - now.getTime());
      
      const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
      const minutes = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
      const seconds = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
      
      setTimeLeftToTomorrow(`${hours}:${minutes}:${seconds}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalQuestions = 10;
  const leftItem = dailyItems[currentIndex] || dailyItems[0];
  const rightItem = dailyItems[currentIndex + 1] || dailyItems[1];

  const handleGuess = useCallback((guess: 'higher' | 'lower') => {
    if (isRevealing || isGameOver) return;

    soundManager.playClick();
    setIsRevealing(true);

    const isCorrect =
      leftItem.value === rightItem.value ||
      (guess === 'higher' ? rightItem.value >= leftItem.value : rightItem.value <= leftItem.value);

    setLastCorrect(isCorrect);

    if (isCorrect) {
      soundManager.playSuccess();
      fireConfetti();
    } else {
      soundManager.playFail();
    }

    const updatedResults = [...results, isCorrect];
    setResults(updatedResults);

    // Transition delay
    setTimeout(() => {
      if (currentIndex + 1 >= totalQuestions) {
        // Daily Challenge Finished!
        setIsGameOver(true);
        setIsRevealing(false);

        const finalScore = updatedResults.filter(Boolean).length;
        if (finalScore >= 8) {
          fireSuperConfetti();
          soundManager.playFanfare();
        }

        // Save official result if not in practice mode
        if (!isPractice) {
          const record: DailyResult = {
            date: todayStr,
            dayNumber,
            score: finalScore,
            total: totalQuestions,
            results: updatedResults,
            completedAt: new Date().toISOString(),
          };
          saveStoredDailyResult(record);
        }
      } else {
        setCurrentIndex((prev) => prev + 1);
        setIsRevealing(false);
        setLastCorrect(null);
      }
    }, 1200);
  }, [currentIndex, isGameOver, isPractice, isRevealing, leftItem, rightItem, results, todayStr, dayNumber]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isRevealing || isGameOver) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        handleGuess('higher');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        handleGuess('lower');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGuess, isGameOver, isRevealing]);

  const score = results.filter(Boolean).length;

  const handleShare = async () => {
    soundManager.playClick();
    const resultObj: DailyResult = {
      date: todayStr,
      dayNumber,
      score,
      total: totalQuestions,
      results: results.length === totalQuestions ? results : [...results, ...Array(totalQuestions - results.length).fill(false)],
      completedAt: new Date().toISOString(),
    };
    const text = generateDailyShareText(resultObj);

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `YÜDÜ Günlük #${dayNumber}`,
          text,
          url: 'https://yudu.app/gunluk',
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const restartPractice = () => {
    soundManager.playClick();
    setIsPractice(true);
    setCurrentIndex(0);
    setResults([]);
    setIsRevealing(false);
    setIsGameOver(false);
    setLastCorrect(null);
  };

  return (
    <main className="h-[100dvh] w-screen overflow-hidden bg-slate-950 text-white relative select-none flex flex-col md:flex-row">
      {/* Top Floating Header */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-2.5 sm:p-4 md:p-6 pointer-events-none">
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          <Link
            href="/"
            onClick={() => soundManager.playClick()}
            className="flex items-center gap-1.5 text-slate-100 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-white/20 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-lg"
          >
            <Image src="/logo.png" alt="YÜDÜ" width={20} height={20} className="w-4 h-4 sm:w-5 sm:h-5 object-contain" />
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300" />
            <span className="hidden sm:inline">Ana Sayfa</span>
          </Link>
          <SoundToggle className="!bg-slate-900/80 !border-white/20 text-slate-200 !w-8 !h-8 sm:!w-9 sm:!h-9" />
        </div>

        {/* Challenge Day Badge & Progress */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 text-amber-300 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-black shadow-lg">
            <Calendar className="w-3.5 h-3.5" />
            <span>Günün YÜDÜ&apos;sü #{dayNumber}</span>
          </div>
          <div className="bg-slate-900/80 border border-white/20 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold text-white shadow-lg">
            {currentIndex + 1} / {totalQuestions}
          </div>
        </div>
      </header>

      {/* Progress Dots Bar */}
      <div className="absolute top-14 sm:top-16 md:top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex gap-1.5 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-xl">
        {Array.from({ length: totalQuestions }).map((_, i) => {
          const res = results[i];
          const isCurrent = i === currentIndex && !isGameOver;
          return (
            <div
              key={i}
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-[9px] font-black transition-all duration-300 ${
                res === true
                  ? 'bg-emerald-500 text-slate-950 scale-105 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                  : res === false
                  ? 'bg-rose-500 text-white scale-105 shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                  : isCurrent
                  ? 'border-2 border-amber-400 bg-amber-400/20 animate-pulse scale-110'
                  : 'bg-white/10'
              }`}
            >
              {res === true ? '✓' : res === false ? '✕' : ''}
            </div>
          );
        })}
      </div>

      {/* LEFT ITEM (Reference) */}
      <section className="relative flex-1 h-1/2 md:h-full w-full flex flex-col justify-center items-center p-4 sm:p-8 text-center overflow-hidden border-b md:border-b-0 md:border-r border-white/10">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 brightness-95 scale-105"
          style={{ backgroundImage: `url(${leftItem.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/45 to-slate-950/50 backdrop-blur-[2px]" />

        <div className="relative z-10 max-w-sm sm:max-w-md w-full px-4 flex flex-col items-center">
          <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-amber-300/90 bg-amber-500/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full mb-2">
            Referans
          </span>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white drop-shadow-lg tracking-tight mb-2 sm:mb-3">
            {leftItem.name}
          </h2>
          <div className="inline-block bg-slate-950/70 border border-white/20 backdrop-blur-md rounded-2xl px-4 py-2 sm:py-2.5 shadow-2xl">
            <span className="text-xl sm:text-2xl md:text-3xl font-black font-mono text-amber-300 drop-shadow">
              {formatGameValue(leftItem)}
            </span>
          </div>
        </div>
      </section>

      {/* RIGHT ITEM (Question) */}
      <section className="relative flex-1 h-1/2 md:h-full w-full flex flex-col justify-center items-center p-4 sm:p-8 text-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 brightness-95 scale-105"
          style={{ backgroundImage: `url(${rightItem.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/45 to-slate-950/50 backdrop-blur-[2px]" />

        <div className="relative z-10 max-w-sm sm:max-w-md w-full px-4 flex flex-col items-center">
          <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-emerald-300/90 bg-emerald-500/10 border border-emerald-400/20 px-2.5 py-0.5 rounded-full mb-2">
            Hedef
          </span>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white drop-shadow-lg tracking-tight mb-2 sm:mb-3">
            {rightItem.name}
          </h2>

          {/* Value Display OR Action Buttons */}
          <div className="w-full min-h-[90px] sm:min-h-[110px] flex items-center justify-center">
            {isRevealing ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`inline-block border backdrop-blur-md rounded-2xl px-5 py-3 shadow-2xl ${
                  lastCorrect
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-1 font-bold text-xs uppercase tracking-wider">
                  {lastCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Doğru Tahmin!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Yanlış!</span>
                    </>
                  )}
                </div>
                <span className="text-xl sm:text-3xl font-black font-mono">
                  {formatGameValue(rightItem)}
                </span>
              </motion.div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 w-full max-w-xs">
                <button
                  onClick={() => handleGuess('higher')}
                  disabled={isRevealing || isGameOver}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black py-2.5 sm:py-3.5 px-4 rounded-2xl shadow-xl transition-all active:scale-95 text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 border border-emerald-400/40"
                >
                  ▲ Daha Yüksek
                </button>
                <button
                  onClick={() => handleGuess('lower')}
                  disabled={isRevealing || isGameOver}
                  className="flex-1 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black py-2.5 sm:py-3.5 px-4 rounded-2xl shadow-xl transition-all active:scale-95 text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 border border-rose-400/40"
                >
                  ▼ Daha Düşük
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FINISHED / RESULTS MODAL */}
      <AnimatePresence>
        {isGameOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/20 rounded-3xl p-5 sm:p-7 max-w-md w-full text-center shadow-2xl relative overflow-hidden"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider mb-2">
                <Trophy className="w-3.5 h-3.5" />
                Günün YÜDÜ&apos;sü Tamamlandı!
              </div>

              <div className="my-3">
                <Image
                  src="/logo.png"
                  alt="YÜDÜ Logo"
                  width={56}
                  height={56}
                  className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2 object-contain drop-shadow-md rounded-xl"
                />
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {score === 10
                    ? '10/10 EFSANEVİ! 👑'
                    : score >= 8
                    ? 'Harika Performans! 🔥'
                    : score >= 5
                    ? 'Güzel Mücadele! 👏'
                    : 'Yarın Tekrar Dene! 🎯'}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm mt-1">
                  10 sorunun {score} tanesini doğru bildin.
                </p>
              </div>

              {/* Emoji Grid Display */}
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-3 my-3">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                  Bugünkü Tablon
                </span>
                <div className="flex justify-center gap-1.5 text-xl sm:text-2xl">
                  {results.map((r, i) => (
                    <span key={i}>{r ? '🟩' : '🟥'}</span>
                  ))}
                </div>
              </div>

              {/* Countdown to next day */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300/90 font-mono mb-4 bg-amber-500/10 border border-amber-400/20 py-2 rounded-xl">
                <Clock className="w-3.5 h-3.5" />
                <span>Yarınki mücadeleye kalan süre: <strong>{timeLeftToTomorrow}</strong></span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleShare}
                  className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black py-3 rounded-xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2 shadow-lg"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Sonuç Panoya Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Sonucunu Arkadaşlarına Gönder</span>
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={restartPractice}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-white/10"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Pratik Yap
                  </button>
                  <Link
                    href="/"
                    onClick={() => soundManager.playClick()}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    Kategoriler
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
