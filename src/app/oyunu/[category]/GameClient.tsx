'use client';

import { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Trophy, 
  Flame, 
  Heart, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  Zap
} from 'lucide-react';
import { GAME_DATA } from '@/data/items';
import { CATEGORIES } from '@/data/categories';
import { GameItem, GameMode } from '@/types/game';
import { formatGameValue } from '@/lib/format';
import { soundManager } from '@/lib/sound';
import { fireConfetti, fireSuperConfetti } from '@/lib/confetti';
import { getGameOverCommentary, getStreakShoutout } from '@/lib/gameCopy';
import { SoundToggle } from '@/components/SoundToggle';
import { NumberTicker } from '@/components/NumberTicker';
import { ShareButton } from '@/components/ShareButton';

interface GameClientProps {
  categoryId: string;
}

function getSavedHighScore(categoryId: string, mode: GameMode): number {
  if (typeof window === 'undefined') return 0;
  try {
    const saved = localStorage.getItem(`yudu_high_${categoryId}_${mode}`);
    return saved ? parseInt(saved, 10) : 0;
  } catch {
    return 0;
  }
}

function getInitialDeck(items: GameItem[]) {
  if (items.length < 2) {
    return { left: null, right: null, deck: [] };
  }
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return {
    left: shuffled[0],
    right: shuffled[1],
    deck: shuffled.slice(2),
  };
}

export function GameClient({ categoryId }: GameClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const category = CATEGORIES.find((c) => c.id === categoryId);
  const rawItems = useMemo(
    () => GAME_DATA[categoryId as keyof typeof GAME_DATA] || [],
    [categoryId]
  );

  // Game Mode: 'classic' (1 life), 'lives' (3 lives), 'time' (60s countdown)
  const [mode, setMode] = useState<GameMode>('classic');

  // Deck & items initialized eagerly
  const initialSetup = useMemo(() => getInitialDeck(rawItems), [rawItems]);
  const [deck, setDeck] = useState<GameItem[]>(initialSetup.deck);
  const [leftItem, setLeftItem] = useState<GameItem | null>(initialSetup.left);
  const [rightItem, setRightItem] = useState<GameItem | null>(initialSetup.right);

  // Score states
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getSavedHighScore(categoryId, 'classic'));
  const [streak, setStreak] = useState<number>(0);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // Mode specific: Lives & Time
  const [lives, setLives] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  // Status flags
  const [showResult, setShowResult] = useState<boolean>(false);
  const [lastGuessResult, setLastGuessResult] = useState<'correct' | 'wrong' | 'tie' | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // Restart / Reset game helper
  const restartWithMode = useCallback((targetMode: GameMode) => {
    if (rawItems.length < 2) return;

    const setup = getInitialDeck(rawItems);
    setLeftItem(setup.left);
    setRightItem(setup.right);
    setDeck(setup.deck);

    setScore(0);
    setStreak(0);
    setIsNewRecord(false);
    setShowResult(false);
    setLastGuessResult(null);
    setIsGameOver(false);
    setIsTransitioning(false);
    setScreenShake(false);
    setHighScore(getSavedHighScore(categoryId, targetMode));

    if (targetMode === 'lives') {
      setLives(3);
      setTimerActive(false);
    } else if (targetMode === 'time') {
      setTimeLeft(60);
      setTimerActive(true);
    } else {
      setTimerActive(false);
    }
  }, [categoryId, rawItems]);

  // Timer tick for 'time' mode
  useEffect(() => {
    if (mode !== 'time' || !timerActive || isGameOver) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          setIsGameOver(true);
          soundManager.playFail();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, timerActive, isGameOver]);

  // Handle Mode Change
  const handleModeChange = (newMode: GameMode) => {
    if (newMode === mode) return;
    soundManager.playClick();
    setMode(newMode);
    restartWithMode(newMode);
  };

  // Guess Handler
  const handleGuess = useCallback((guess: 'higher' | 'lower') => {
    if (!leftItem || !rightItem || showResult || isGameOver || isTransitioning) return;

    soundManager.playClick();
    setShowResult(true);

    const isEqual = rightItem.value === leftItem.value;
    const isHigher = rightItem.value > leftItem.value;
    const isLower = rightItem.value < leftItem.value;

    // Tie is ALWAYS correct
    const isCorrect = isEqual || (guess === 'higher' && isHigher) || (guess === 'lower' && isLower);

    if (isEqual) {
      setLastGuessResult('tie');
    } else if (isCorrect) {
      setLastGuessResult('correct');
    } else {
      setLastGuessResult('wrong');
    }

    // Delay reveal to build suspense with NumberTicker
    setTimeout(() => {
      if (isCorrect) {
        soundManager.playSuccess();
        const newScore = score + 1;
        const newStreak = streak + 1;
        setScore(newScore);
        setStreak(newStreak);

        // Milestone confetti every 5 streak
        if (newStreak % 5 === 0) {
          fireConfetti();
        }

        // Time mode bonus (+2s)
        if (mode === 'time') {
          setTimeLeft((t) => Math.min(t + 2, 90));
        }

        // Record check
        if (newScore > highScore) {
          setHighScore(newScore);
          setIsNewRecord(true);
          localStorage.setItem(`yudu_high_${categoryId}_${mode}`, newScore.toString());
          if (newScore === highScore + 1) {
            fireSuperConfetti();
            soundManager.playHighScore();
          }
        }

        // Slide card to next
        setIsTransitioning(true);
        setTimeout(() => {
          setLeftItem(rightItem);
          if (deck.length > 0) {
            setRightItem(deck[0]);
            setDeck((prev) => prev.slice(1));
          } else {
            const freshDeck = [...rawItems]
              .filter((i) => i.id !== rightItem.id)
              .sort(() => Math.random() - 0.5);
            setRightItem(freshDeck[0]);
            setDeck(freshDeck.slice(1));
          }
          setShowResult(false);
          setLastGuessResult(null);
          setIsTransitioning(false);
        }, 500);

      } else {
        // Wrong Guess
        soundManager.playFail();
        setStreak(0);
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 500);

        if (mode === 'lives') {
          const nextLives = lives - 1;
          setLives(nextLives);
          if (nextLives <= 0) {
            setIsGameOver(true);
          } else {
            setTimeout(() => {
              setLeftItem(rightItem);
              if (deck.length > 0) {
                setRightItem(deck[0]);
                setDeck((prev) => prev.slice(1));
              } else {
                const freshDeck = [...rawItems]
                  .filter((i) => i.id !== rightItem.id)
                  .sort(() => Math.random() - 0.5);
                setRightItem(freshDeck[0]);
                setDeck(freshDeck.slice(1));
              }
              setShowResult(false);
              setLastGuessResult(null);
            }, 1000);
          }
        } else if (mode === 'time') {
          setTimeLeft((t) => Math.max(t - 5, 0));
          setTimeout(() => {
            setLeftItem(rightItem);
            if (deck.length > 0) {
              setRightItem(deck[0]);
              setDeck((prev) => prev.slice(1));
            } else {
              const freshDeck = [...rawItems]
                .filter((i) => i.id !== rightItem.id)
                .sort(() => Math.random() - 0.5);
              setRightItem(freshDeck[0]);
              setDeck(freshDeck.slice(1));
            }
            setShowResult(false);
            setLastGuessResult(null);
          }, 800);
        } else {
          setIsGameOver(true);
        }
      }
    }, 1100);
  }, [categoryId, deck, highScore, isGameOver, isTransitioning, leftItem, lives, mode, rawItems, rightItem, score, showResult, streak]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          restartWithMode(mode);
        }
        return;
      }

      if (showResult) return;

      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        handleGuess('higher');
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        handleGuess('lower');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, showResult, handleGuess, restartWithMode, mode]);

  if (!category || rawItems.length < 2) {
    return (
      <div className="h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black mb-4">Bu kategori için yeterli veri bulunamadı.</h2>
        <Link
          href="/"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition"
        >
          Kategorilere Dön
        </Link>
      </div>
    );
  }

  if (!leftItem || !rightItem) {
    return (
      <div className="h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 font-medium">
          <RotateCcw className="w-5 h-5 animate-spin text-amber-400" />
          Yükleniyor...
        </div>
      </div>
    );
  }

  const higherBtnLabel = category.higherLabel || '▲ DAHA YÜKSEK';
  const lowerBtnLabel = category.lowerLabel || '▼ DAHA DÜŞÜK';
  const commentary = getGameOverCommentary(score);
  const shoutout = getStreakShoutout(streak);

  return (
    <main className={`h-screen w-screen overflow-hidden bg-black text-white relative select-none flex flex-col md:flex-row ${screenShake ? 'animate-screen-shake' : ''}`}>
      {/* Floating Header Overlay */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3 md:p-6 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              soundManager.playClick();
              startTransition(() => {
                router.push('/');
              });
            }}
            className="flex items-center gap-1.5 text-white bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/15 px-3 py-2 rounded-2xl text-xs md:text-sm font-bold transition-all active:scale-95 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kategoriler</span>
          </button>

          <div className="pointer-events-auto">
            <SoundToggle className="!bg-black/60 !border-white/15 text-white" />
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-black/65 backdrop-blur-md p-1 rounded-2xl border border-white/15 text-[11px] md:text-xs font-black pointer-events-auto shadow-lg">
          <button
            onClick={() => handleModeChange('classic')}
            className={`px-2.5 py-1.5 rounded-xl transition-all ${
              mode === 'classic'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            🎯 1 Can
          </button>
          <button
            onClick={() => handleModeChange('lives')}
            className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
              mode === 'lives'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Heart className="w-3 h-3 fill-current" /> 3 Can
          </button>
          <button
            onClick={() => handleModeChange('time')}
            className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
              mode === 'time'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3" /> Süre
          </button>
        </div>

        {/* Score Counters */}
        <div className="flex items-center gap-2 md:gap-3 pointer-events-auto text-xs md:text-sm font-black">
          {mode === 'lives' && (
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/15 px-2.5 py-1.5 rounded-2xl">
              {[1, 2, 3].map((heartIndex) => (
                <Heart
                  key={heartIndex}
                  className={`w-3.5 h-3.5 transition-all duration-300 ${
                    heartIndex <= lives
                      ? 'text-rose-500 fill-rose-500 scale-100'
                      : 'text-white/20 scale-90'
                  }`}
                />
              ))}
            </div>
          )}

          {mode === 'time' && (
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-2xl border font-mono font-black backdrop-blur-md ${
              timeLeft <= 10 
                ? 'bg-rose-600/80 border-rose-400 text-white animate-pulse' 
                : 'bg-black/60 border-white/15 text-amber-400'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-2xl text-emerald-400">
            <span className="text-[11px] uppercase tracking-wider text-slate-400">Skor</span>
            <span className="font-mono text-white text-sm md:text-base">{score}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-2xl text-amber-400">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-white text-sm md:text-base">{highScore}</span>
          </div>
        </div>
      </header>

      {/* Streak Alert Pill */}
      {shoutout && !isGameOver && (
        <div className="absolute top-16 md:top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-amber-400 text-slate-950 font-black px-4 py-1 rounded-full text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(251,191,36,0.6)] flex items-center gap-1.5"
          >
            <Flame className="w-3.5 h-3.5 fill-slate-950" />
            {shoutout}
          </motion.div>
        </div>
      )}

      {/* Center "VS" Circular Badge */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-amber-400 text-slate-950 font-black text-lg md:text-xl flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.8)] border-4 border-slate-950 animate-vs-pulse">
          VS
        </div>
      </div>

      {/* ===================== LEFT HALF: KNOWN ITEM ===================== */}
      <section 
        className="w-full md:w-1/2 h-1/2 md:h-full relative flex flex-col justify-center items-center p-6 md:p-12 text-center overflow-hidden border-b md:border-b-0 md:border-r border-white/10 group"
      >
        {/* Full-bleed Photo Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${leftItem.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'})` }}
        />
        {/* Dark Cinematic Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/60 backdrop-blur-[2px]" />

        {/* Content */}
        <div className="relative z-10 max-w-md flex flex-col items-center">
          <span className="text-[11px] md:text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/15 text-slate-200 border border-white/20 mb-3 md:mb-4">
            {category.icon} {category.title}
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] mb-3">
            {leftItem.name}
          </h2>

          <div className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">
            {category.valueLabel}
          </div>

          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-mono text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.5)]">
            {formatGameValue(leftItem, category.id)}
          </div>
        </div>
      </section>

      {/* ===================== RIGHT HALF: CHALLENGER ===================== */}
      <section 
        className={`w-full md:w-1/2 h-1/2 md:h-full relative flex flex-col justify-center items-center p-6 md:p-12 text-center overflow-hidden transition-all duration-300 group ${
          showResult
            ? lastGuessResult === 'correct' || lastGuessResult === 'tie'
              ? 'ring-8 ring-emerald-500/70'
              : 'ring-8 ring-rose-500/70'
            : ''
        }`}
      >
        {/* Full-bleed Photo Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${rightItem.image || 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=80'})` }}
        />
        {/* Dark Cinematic Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/60 backdrop-blur-[2px]" />

        {/* Content */}
        <div className="relative z-10 max-w-md w-full flex flex-col items-center">
          <span className="text-[11px] md:text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/15 text-slate-200 border border-white/20 mb-3 md:mb-4">
            Rakip Öğe
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] mb-3">
            {rightItem.name}
          </h2>

          <div className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">
            {category.valueLabel}
          </div>

          {!showResult ? (
            <div className="flex flex-col gap-2.5 sm:gap-3 w-full max-w-xs mt-2">
              <button
                onClick={() => handleGuess('higher')}
                className="group relative bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 md:py-4 px-6 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-emerald-300"
              >
                <span className="text-sm md:text-base tracking-wider">{higherBtnLabel}</span>
                <span className="text-[10px] bg-slate-950/20 text-slate-950 px-1.5 py-0.5 rounded font-mono font-bold hidden sm:inline">
                  W / ↑
                </span>
              </button>

              <button
                onClick={() => handleGuess('lower')}
                className="group relative bg-rose-600 hover:bg-rose-500 text-white font-black py-3 md:py-4 px-6 rounded-2xl shadow-[0_0_25px_rgba(225,29,72,0.4)] transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-rose-400"
              >
                <span className="text-sm md:text-base tracking-wider">{lowerBtnLabel}</span>
                <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded font-mono font-bold hidden sm:inline">
                  S / ↓
                </span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[110px] md:min-h-[130px]">
              <NumberTicker
                value={rightItem.value}
                unit={rightItem.unit}
                categoryId={category.id}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.6)] font-mono font-black"
              />

              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-3 flex items-center gap-2 font-black text-xs md:text-sm"
              >
                {lastGuessResult === 'tie' && (
                  <span className="flex items-center gap-1.5 bg-amber-400 text-slate-950 px-3 py-1 rounded-full shadow-lg">
                    <Zap className="w-4 h-4 fill-slate-950" />
                    EŞİT DEĞER! (Doğru Sayıldı)
                  </span>
                )}
                {lastGuessResult === 'correct' && (
                  <span className="flex items-center gap-1.5 bg-emerald-500 text-slate-950 px-3 py-1 rounded-full shadow-lg">
                    <CheckCircle2 className="w-4 h-4 fill-slate-950" />
                    DOĞRU TAHMİN!
                  </span>
                )}
                {lastGuessResult === 'wrong' && (
                  <span className="flex items-center gap-1.5 bg-rose-600 text-white px-3 py-1 rounded-full shadow-lg">
                    <XCircle className="w-4 h-4 fill-white" />
                    YANLIŞ TAHMİN!
                  </span>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </section>

      {/* Game Over Modal */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-950 border border-white/15 rounded-3xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden"
            >
              {isNewRecord && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest py-1.5 flex items-center justify-center gap-1.5 shadow-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  YENİ KİŞİSEL REKOR!
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}

              <div className="mt-4 mb-2">
                <div className="text-5xl mb-2">{commentary.emoji}</div>
                <h3 className="text-2xl md:text-3xl font-black text-white">
                  {mode === 'time' && timeLeft <= 0 ? 'Süre Doldu!' : commentary.title}
                </h3>
                <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
                  {commentary.subtitle}
                </p>
                <div className="mt-3 text-xs bg-white/5 border border-white/10 rounded-xl p-2.5 text-slate-300">
                  <span className="font-bold text-white">{rightItem.name}</span>: {' '}
                  <span className="text-amber-400 font-bold font-mono">{formatGameValue(rightItem, category.id)}</span> idi.
                </div>
              </div>

              {/* Score Display Card */}
              <div className="bg-black/60 border border-white/10 rounded-2xl p-4 my-5 grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Skorun</span>
                  <span className="text-3xl md:text-4xl font-black font-mono text-emerald-400">{score}</span>
                </div>
                <div className="flex flex-col items-center border-l border-white/10">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Rekorun</span>
                  <span className="text-3xl md:text-4xl font-black font-mono text-amber-400">{highScore}</span>
                </div>
              </div>

              {/* Share Component */}
              <div className="mb-4">
                <ShareButton score={score} categoryTitle={category.title} />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    restartWithMode(mode);
                  }}
                  className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-3.5 rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Tekrar Dene
                  <span className="text-xs opacity-60 hidden sm:inline">[Boşluk]</span>
                </button>
                <button
                  onClick={() => {
                    soundManager.playClick();
                    startTransition(() => {
                      router.push('/');
                    });
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3.5 rounded-xl transition-all active:scale-95 text-sm border border-white/15"
                >
                  Kategoriler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
