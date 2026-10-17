'use client';

import { useState, useEffect, useCallback, useMemo, useTransition, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Zap,
  Shield,
  Lightbulb,
  FastForward,
  Swords
} from 'lucide-react';
import { GAME_DATA } from '@/data/items';
import { CATEGORIES } from '@/data/categories';
import { GameItem, GameMode, CategoryType, CategoryConfig } from '@/types/game';
import { formatGameValue } from '@/lib/format';
import { soundManager } from '@/lib/sound';
import { fireConfetti, fireSuperConfetti } from '@/lib/confetti';
import { getGameOverCommentary, getStreakShoutout } from '@/lib/gameCopy';
import { recordGameResult } from '@/lib/stats';
import { SoundToggle } from '@/components/SoundToggle';
import { StatsModal } from '@/components/StatsModal';
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

const BASE_CATEGORIES: CategoryType[] = [
  'ulke',
  'sehir',
  'film',
  'futbol',
  'sirket',
  'sosyal',
  'araba',
  'tarih',
  'isim',
];

function getRandomCategoryPair(excludeCatId?: string): {
  category: CategoryConfig;
  left: GameItem;
  right: GameItem;
} {
  const available = BASE_CATEGORIES.filter((c) => c !== excludeCatId);
  const chosenCatId = available[Math.floor(Math.random() * available.length)];
  const config = CATEGORIES.find((c) => c.id === chosenCatId) || CATEGORIES[0];
  const items = GAME_DATA[chosenCatId as CategoryType] || [];

  const shuffled = [...items].sort(() => Math.random() - 0.5);
  const left = shuffled[0];
  let right = shuffled[1];
  for (let i = 1; i < shuffled.length; i++) {
    if (shuffled[i].value !== left.value) {
      right = shuffled[i];
      break;
    }
  }
  return { category: config, left, right };
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
  const isKarisik = categoryId === 'karisik';
  const rawItems = useMemo(
    () => GAME_DATA[categoryId as keyof typeof GAME_DATA] || [],
    [categoryId]
  );

  // Initial setup distinguishing karisik vs single category
  const initialSetup = useMemo(() => {
    if (isKarisik) {
      const pair = getRandomCategoryPair();
      return {
        activeCat: pair.category,
        left: pair.left,
        right: pair.right,
        deck: [] as GameItem[],
      };
    }
    const deckSetup = getInitialDeck(rawItems);
    return {
      activeCat: category || CATEGORIES[0],
      left: deckSetup.left,
      right: deckSetup.right,
      deck: deckSetup.deck,
    };
  }, [category, isKarisik, rawItems]);

  const [activeCategory, setActiveCategory] = useState<CategoryConfig>(initialSetup.activeCat);
  const [deck, setDeck] = useState<GameItem[]>(initialSetup.deck);
  const [leftItem, setLeftItem] = useState<GameItem | null>(initialSetup.left);
  const [rightItem, setRightItem] = useState<GameItem | null>(initialSetup.right);

  // Game Mode: 'classic' (1 life), 'lives' (3 lives), 'time' (60s countdown)
  const [mode, setMode] = useState<GameMode>('classic');

  // Score states
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getSavedHighScore(categoryId, 'classic'));
  const [streak, setStreak] = useState<number>(0);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // Mode specific: Lives & Time
  const [lives, setLives] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  // Power-up Jokers
  const [usedSkip, setUsedSkip] = useState<boolean>(false);
  const [usedHint, setUsedHint] = useState<boolean>(false);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [shieldActive, setShieldActive] = useState<boolean>(false);
  const [usedShield, setUsedShield] = useState<boolean>(false);
  const [shieldSavedGame, setShieldSavedGame] = useState<boolean>(false);

  // Stats Modal
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);

  // Status flags
  const [showResult, setShowResult] = useState<boolean>(false);
  const [lastGuessResult, setLastGuessResult] = useState<'correct' | 'wrong' | 'tie' | 'shield_saved' | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // Challenge Mode State (?target=12)
  const [challengeTarget] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const targetParam = params.get('target');
    if (targetParam) {
      const val = parseInt(targetParam, 10);
      return !isNaN(val) && val > 0 ? val : null;
    }
    return null;
  });
  const challengeBeaten = challengeTarget !== null && score > challengeTarget;
  const challengeCelebratedRef = useRef(false);

  // Restart / Reset game helper
  const restartWithMode = useCallback((targetMode: GameMode) => {
    if (isKarisik) {
      const pair = getRandomCategoryPair();
      setActiveCategory(pair.category);
      setLeftItem(pair.left);
      setRightItem(pair.right);
      setDeck([]);
    } else {
      if (rawItems.length < 2) return;
      const setup = getInitialDeck(rawItems);
      setLeftItem(setup.left);
      setRightItem(setup.right);
      setDeck(setup.deck);
    }

    setScore(0);
    setStreak(0);
    setIsNewRecord(false);
    setShowResult(false);
    setLastGuessResult(null);
    setIsGameOver(false);
    setIsTransitioning(false);
    setScreenShake(false);

    // Reset Jokers
    setUsedSkip(false);
    setUsedHint(false);
    setActiveHint(null);
    setShieldActive(false);
    setUsedShield(false);
    setShieldSavedGame(false);

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
  }, [categoryId, isKarisik, rawItems]);

  // Card Advance Helper (Balanced for single category and Karisik)
  const advanceToNext = useCallback(() => {
    if (isKarisik) {
      const nextPair = getRandomCategoryPair(activeCategory.id);
      setActiveCategory(nextPair.category);
      setLeftItem(nextPair.left);
      setRightItem(nextPair.right);
    } else {
      setLeftItem(rightItem);
      if (deck.length > 0) {
        setRightItem(deck[0]);
        setDeck((prev) => prev.slice(1));
      } else {
        const freshDeck = [...rawItems]
          .filter((i) => i.id !== rightItem?.id)
          .sort(() => Math.random() - 0.5);
        setRightItem(freshDeck[0]);
        setDeck(freshDeck.slice(1));
      }
    }
    setShowResult(false);
    setLastGuessResult(null);
    setIsTransitioning(false);
  }, [activeCategory.id, deck, isKarisik, rawItems, rightItem]);

  // Handle Game Over & Save Stats
  const triggerGameOver = useCallback((finalScore: number, finalStreak: number) => {
    setIsGameOver(true);
    setTimerActive(false);
    recordGameResult({
      score: finalScore,
      streak: finalStreak,
      mode,
      categoryId,
      shieldUsedAndSaved: shieldSavedGame,
    });
  }, [categoryId, mode, shieldSavedGame]);

  // Timer tick for 'time' mode
  useEffect(() => {
    if (mode !== 'time' || !timerActive || isGameOver) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          soundManager.playFail();
          triggerGameOver(score, streak);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, timerActive, isGameOver, score, streak, triggerGameOver]);

  // Handle Mode Change
  const handleModeChange = (newMode: GameMode) => {
    if (newMode === mode) return;
    soundManager.playClick();
    setMode(newMode);
    restartWithMode(newMode);
  };

  // Joker Handlers
  const handleUseSkip = () => {
    if (usedSkip || showResult || isGameOver || isTransitioning || !leftItem) return;
    soundManager.playJoker();
    setUsedSkip(true);

    if (isKarisik) {
      const pair = getRandomCategoryPair(activeCategory.id);
      setActiveCategory(pair.category);
      setLeftItem(pair.left);
      setRightItem(pair.right);
    } else {
      if (deck.length > 0) {
        setRightItem(deck[0]);
        setDeck((prev) => prev.slice(1));
      } else {
        const freshDeck = [...rawItems].filter((i) => i.id !== rightItem?.id && i.id !== leftItem?.id).sort(() => Math.random() - 0.5);
        setRightItem(freshDeck[0]);
        setDeck(freshDeck.slice(1));
      }
    }
  };

  const handleUseHint = () => {
    if (usedHint || !leftItem || !rightItem || showResult || isGameOver || isTransitioning) return;
    soundManager.playJoker();
    setUsedHint(true);
    const v1 = Math.abs(leftItem.value);
    const v2 = Math.abs(rightItem.value);
    const maxVal = Math.max(v1, v2);
    const minVal = Math.min(v1, v2);
    const diffPct = maxVal === 0 ? 0 : Math.round(((maxVal - minVal) / (minVal || 1)) * 100);

    if (diffPct <= 20) {
      setActiveHint('⚠️ ÇOK YAKIN! Değerler neredeyse birbirine denk (%20 farkın altında)!');
    } else if (diffPct <= 75) {
      setActiveHint('⚖️ ORTA DÜZEY! Aralarında ortalama bir fark bulunuyor.');
    } else {
      setActiveHint('🚀 BÜYÜK UÇURUM! Biri diğerinden kat kat büyük!');
    }

    setTimeout(() => {
      setActiveHint(null);
    }, 5000);
  };

  const handleUseShield = () => {
    if (usedShield || shieldActive || showResult || isGameOver || isTransitioning) return;
    soundManager.playShield();
    setShieldActive(true);
    setUsedShield(true);
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
          advanceToNext();
        }, 600);

      } else {
        // Wrong Guess - Check if shield is active!
        if (shieldActive) {
          soundManager.playSuccess();
          setShieldActive(false);
          setShieldSavedGame(true);
          setLastGuessResult('shield_saved');
          fireConfetti();

          setTimeout(() => {
            advanceToNext();
          }, 1200);
          return;
        }

        // True Wrong Guess
        soundManager.playFail();
        setStreak(0);
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 500);

        if (mode === 'lives') {
          const nextLives = lives - 1;
          setLives(nextLives);
          if (nextLives <= 0) {
            triggerGameOver(score, 0);
          } else {
            setTimeout(() => {
              advanceToNext();
            }, 1000);
          }
        } else if (mode === 'time') {
          setTimeLeft((t) => Math.max(t - 5, 0));
          setTimeout(() => {
            advanceToNext();
          }, 800);
        } else {
          triggerGameOver(score, 0);
        }
      }
    }, 1100);
  }, [advanceToNext, categoryId, highScore, isGameOver, isTransitioning, leftItem, lives, mode, rightItem, score, shieldActive, showResult, streak, triggerGameOver]);

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

  // Trigger celebration once when challenge score is beaten
  useEffect(() => {
    if (challengeBeaten && !challengeCelebratedRef.current) {
      challengeCelebratedRef.current = true;
      soundManager.playFanfare();
      fireSuperConfetti();
    }
  }, [challengeBeaten]);

  if (!category || (!isKarisik && rawItems.length < 2)) {
    return (
      <div className="h-[100dvh] bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl md:text-2xl font-black mb-4">Bu kategori için yeterli veri bulunamadı.</h2>
        <Link
          href="/"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-2xl transition shadow-lg"
        >
          Kategorilere Dön
        </Link>
      </div>
    );
  }

  if (!leftItem || !rightItem) {
    return (
      <div className="h-[100dvh] bg-slate-900 text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-300 font-medium">
          <RotateCcw className="w-5 h-5 animate-spin text-amber-400" />
          Yükleniyor...
        </div>
      </div>
    );
  }

  const higherBtnLabel = activeCategory.higherLabel || '▲ DAHA YÜKSEK';
  const lowerBtnLabel = activeCategory.lowerLabel || '▼ DAHA DÜŞÜK';
  const commentary = getGameOverCommentary(score);
  const shoutout = getStreakShoutout(streak);

  // Calculate Difference ratio for result feedback
  const diffPercent = leftItem.value !== 0 
    ? Math.abs(Math.round(((rightItem.value - leftItem.value) / leftItem.value) * 100))
    : 0;

  return (
    <main className={`h-[100dvh] w-screen overflow-hidden bg-slate-950 text-white relative select-none flex flex-col md:flex-row ${screenShake ? 'animate-screen-shake' : ''}`}>
      {/* Floating Shield Active Glow Aura */}
      {shieldActive && (
        <div className="absolute inset-0 pointer-events-none ring-4 sm:ring-8 ring-amber-400/80 shadow-[inset_0_0_80px_rgba(251,191,36,0.3)] z-40 animate-pulse" />
      )}

      {/* Floating Header Overlay */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-2.5 sm:p-4 md:p-6 pointer-events-none">
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          <button
            onClick={() => {
              soundManager.playClick();
              startTransition(() => {
                router.push('/');
              });
            }}
            className="flex items-center gap-1.5 text-slate-100 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-white/20 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-lg"
          >
            <Image src="/logo.png" alt="YÜDÜ" width={20} height={20} className="w-4 h-4 sm:w-5 sm:h-5 object-contain" />
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300" />
            <span className="hidden sm:inline">Kategoriler</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setIsStatsOpen(true);
            }}
            className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-white/20 text-amber-300 hover:text-white transition shadow-lg"
            title="İstatistikler & Başarımlar"
          >
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          </button>

          <SoundToggle className="!bg-slate-900/80 !border-white/20 text-slate-200 !w-8 !h-8 sm:!w-9 sm:!h-9" />
        </div>

        {/* Mode Selector */}
        <div className="flex bg-slate-900/85 backdrop-blur-md p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-white/20 text-[10px] sm:text-xs font-black pointer-events-auto shadow-lg">
          <button
            onClick={() => handleModeChange('classic')}
            className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all ${
              mode === 'classic'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            🎯 1 Can
          </button>
          <button
            onClick={() => handleModeChange('lives')}
            className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all flex items-center gap-1 ${
              mode === 'lives'
                ? 'bg-rose-500 text-white shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Heart className="w-3 h-3 fill-current" /> 3 Can
          </button>
          <button
            onClick={() => handleModeChange('time')}
            className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all flex items-center gap-1 ${
              mode === 'time'
                ? 'bg-indigo-500 text-white shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3" /> Süre
          </button>
        </div>

        {/* Score Counters */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 pointer-events-auto text-xs sm:text-sm font-black">
          {mode === 'lives' && (
            <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-900/80 backdrop-blur-md border border-white/20 px-2 sm:px-2.5 py-1.5 rounded-xl sm:rounded-2xl">
              {[1, 2, 3].map((heartIndex) => (
                <Heart
                  key={heartIndex}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-all duration-300 ${
                    heartIndex <= lives
                      ? 'text-rose-500 fill-rose-500 scale-100'
                      : 'text-white/20 scale-90'
                  }`}
                />
              ))}
            </div>
          )}

          {mode === 'time' && (
            <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl sm:rounded-2xl border font-mono font-black backdrop-blur-md ${
              timeLeft <= 10 
                ? 'bg-rose-600/90 border-rose-400 text-white animate-pulse' 
                : 'bg-slate-900/80 border-white/20 text-amber-300'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
          )}

          <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-white/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl text-emerald-400">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400">Skor</span>
            <span className="font-mono text-white text-xs sm:text-base">{score}</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-white/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl text-amber-300">
            <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
            <span className="font-mono text-white text-xs sm:text-base">{highScore}</span>
          </div>
        </div>
      </header>

      {/* Floating Center Notification Stack (Category Context, Challenge & Streaks) */}
      <div className="absolute top-14 sm:top-16 md:top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center gap-1.5 w-max">
        {/* Active Category Context Badge */}
        {!isGameOver && (
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-white/25 shadow-2xl text-[11px] sm:text-xs md:text-sm font-black text-amber-300">
            <span className="text-sm">{activeCategory.icon}</span>
            <span className="uppercase tracking-wider">
              {isKarisik ? `Karışık: ${activeCategory.title}` : activeCategory.title}
            </span>
            <span className="text-white/30">&bull;</span>
            <span className="text-slate-300 font-bold">{activeCategory.valueLabel}</span>
          </div>
        )}

        {challengeTarget !== null && !isGameOver && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className={`px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xl border backdrop-blur-md ${
              challengeBeaten
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 animate-bounce'
                : 'bg-rose-600/95 text-white border-rose-400'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>
              {challengeBeaten
                ? `Meydan Okuma Başarıldı! (${score} > ${challengeTarget}) 🎉`
                : `Meydan Okuma: ${challengeTarget} Skoru Geç!`}
            </span>
          </motion.div>
        )}

        {shoutout && !isGameOver && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-amber-400 text-slate-950 font-black px-3.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(251,191,36,0.6)] flex items-center gap-1.5"
          >
            <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-slate-950" />
            {shoutout}
          </motion.div>
        )}
      </div>

      {/* Active Hint Banner */}
      <AnimatePresence>
        {activeHint && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-24 sm:top-28 md:top-24 left-1/2 -translate-x-1/2 z-30 bg-indigo-600/95 text-white font-bold text-xs sm:text-sm px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl shadow-2xl border border-indigo-300 flex items-center gap-2 backdrop-blur-md max-w-sm text-center"
          >
            <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />
            <span>{activeHint}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center "VS" Circular Badge - Fluid responsive */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-amber-400 text-slate-950 font-black text-xs sm:text-sm md:text-xl flex items-center justify-center shadow-[0_0_25px_rgba(251,191,36,0.7)] border-2 sm:border-4 border-slate-900 animate-vs-pulse">
          VS
        </div>
      </div>

      {/* ===================== LEFT / TOP HALF: KNOWN ITEM ===================== */}
      <section 
        className="w-full md:w-1/2 h-1/2 md:h-full relative flex flex-col justify-center items-center p-3 sm:p-6 md:p-10 text-center overflow-hidden border-b md:border-b-0 md:border-r border-white/15 group min-h-0"
      >
        {/* Full-bleed Photo Background - Crisp and luminous */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${leftItem.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'})` }}
        />
        {/* Lighter, balanced cinematic gradient overlay (never pitch-black mud) */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/35 to-slate-950/45 backdrop-blur-[1px]" />

        {/* Card Content in Crisp Glass Box */}
        <div className="relative z-10 max-w-md w-full flex flex-col items-center bg-slate-950/60 backdrop-blur-md p-3 sm:p-5 md:p-8 rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 py-0.5 sm:py-1 rounded-full bg-white/20 text-slate-100 border border-white/25 mb-1.5 sm:mb-2.5">
            {activeCategory.icon} {activeCategory.title}
          </span>

          <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-1 sm:mb-2 line-clamp-2">
            {leftItem.name}
          </h2>

          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-300 mb-1">
            {activeCategory.valueLabel}
          </div>

          <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-mono text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]">
            {formatGameValue(leftItem, activeCategory.id)}
          </div>
        </div>
      </section>

      {/* ===================== RIGHT / BOTTOM HALF: CHALLENGER ===================== */}
      <section 
        className={`w-full md:w-1/2 h-1/2 md:h-full relative flex flex-col justify-center items-center p-3 sm:p-6 md:p-10 text-center overflow-hidden transition-all duration-300 group min-h-0 ${
          showResult
            ? lastGuessResult === 'correct' || lastGuessResult === 'tie' || lastGuessResult === 'shield_saved'
              ? 'ring-4 sm:ring-8 ring-emerald-500/80'
              : 'ring-4 sm:ring-8 ring-rose-500/80'
            : ''
        }`}
      >
        {/* Full-bleed Photo Background - Crisp and luminous */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${rightItem.image || 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=80'})` }}
        />
        {/* Lighter, balanced cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/35 to-slate-950/45 backdrop-blur-[1px]" />

        {/* Card Content in Crisp Glass Box */}
        <div className="relative z-10 max-w-md w-full flex flex-col items-center bg-slate-950/60 backdrop-blur-md p-3 sm:p-5 md:p-8 rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 py-0.5 sm:py-1 rounded-full bg-white/20 text-slate-100 border border-white/25 mb-1.5 sm:mb-2.5">
            Rakip Öğe
          </span>

          <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-1 sm:mb-2 line-clamp-2">
            {rightItem.name}
          </h2>

          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-300 mb-1">
            {activeCategory.valueLabel}
          </div>

          {!showResult ? (
            <div className="flex flex-col gap-2 sm:gap-3 w-full max-w-xs mt-1 sm:mt-2">
              <button
                onClick={() => handleGuess('higher')}
                className="group relative bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-300"
              >
                <span className="text-xs sm:text-sm md:text-base tracking-wider font-black">{higherBtnLabel}</span>
                <span className="text-[10px] bg-slate-950/20 text-slate-950 px-1.5 py-0.5 rounded font-mono font-bold hidden sm:inline">
                  W / ↑
                </span>
              </button>

              <button
                onClick={() => handleGuess('lower')}
                className="group relative bg-rose-600 hover:bg-rose-500 text-white font-black py-2.5 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-rose-400"
              >
                <span className="text-xs sm:text-sm md:text-base tracking-wider font-black">{lowerBtnLabel}</span>
                <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded font-mono font-bold hidden sm:inline">
                  S / ↓
                </span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[70px] sm:min-h-[100px]">
              <NumberTicker
                value={rightItem.value}
                unit={rightItem.unit}
                categoryId={activeCategory.id}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-amber-300 drop-shadow-[0_0_25px_rgba(251,191,36,0.6)] font-mono font-black"
              />

              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-2 flex flex-col items-center gap-1 font-black text-[11px] sm:text-xs md:text-sm"
              >
                {lastGuessResult === 'tie' && (
                  <span className="flex items-center gap-1.5 bg-amber-400 text-slate-950 px-3 py-1 rounded-full shadow-lg">
                    <Zap className="w-3.5 h-3.5 fill-slate-950" />
                    EŞİT DEĞER! (Doğru Sayıldı)
                  </span>
                )}
                {lastGuessResult === 'shield_saved' && (
                  <span className="flex items-center gap-1.5 bg-amber-400 text-slate-950 px-3 py-1 rounded-full shadow-lg">
                    <Shield className="w-3.5 h-3.5 fill-slate-950" />
                    KALKAN SENİ KURTARDI!
                  </span>
                )}
                {lastGuessResult === 'correct' && (
                  <span className="flex items-center gap-1.5 bg-emerald-500 text-slate-950 px-3 py-1 rounded-full shadow-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 fill-slate-950" />
                    DOĞRU TAHMİN! (Fark: %{diffPercent})
                  </span>
                )}
                {lastGuessResult === 'wrong' && (
                  <span className="flex items-center gap-1.5 bg-rose-600 text-white px-3 py-1 rounded-full shadow-lg">
                    <XCircle className="w-3.5 h-3.5 fill-white" />
                    YANLIŞ TAHMİN! (Fark: %{diffPercent})
                  </span>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </section>

      {/* Floating Joker Dock (Bottom Center) - Compact & Ergonomic */}
      {!isGameOver && (
        <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 bg-slate-900/85 backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-white/20 shadow-2xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-0.5 sm:mr-1 hidden sm:inline">
            Jokerler:
          </span>

          {/* Skip Joker */}
          <button
            onClick={handleUseSkip}
            disabled={usedSkip || showResult}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
              usedSkip
                ? 'bg-white/5 text-slate-600 border border-transparent cursor-not-allowed'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 active:scale-95 cursor-pointer shadow-sm'
            }`}
            title="Pas Geç (Sağdaki rakip kartı seriyi bozmadan değiştir)"
          >
            <FastForward className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-300" />
            <span>Pas</span>
          </button>

          {/* Hint Joker */}
          <button
            onClick={handleUseHint}
            disabled={usedHint || showResult}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
              usedHint
                ? 'bg-white/5 text-slate-600 border border-transparent cursor-not-allowed'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 active:scale-95 cursor-pointer shadow-sm'
            }`}
            title="İpucu (Farkın büyüklüğünü öğren)"
          >
            <Lightbulb className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
            <span>İpucu</span>
          </button>

          {/* Shield Joker */}
          <button
            onClick={handleUseShield}
            disabled={usedShield || shieldActive || showResult}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
              usedShield || shieldActive
                ? shieldActive 
                  ? 'bg-amber-400 text-slate-950 font-black border border-amber-300 shadow-md animate-pulse'
                  : 'bg-white/5 text-slate-600 border border-transparent cursor-not-allowed'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 active:scale-95 cursor-pointer shadow-sm'
            }`}
            title="Kalkan (1 yanlış cevabı affeder)"
          >
            <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-300" />
            <span>Kalkan</span>
          </button>
        </div>
      )}

      {/* Game Over Modal */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-white/20 rounded-3xl p-5 sm:p-7 md:p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden"
            >
              {isNewRecord && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest py-1.5 flex items-center justify-center gap-1.5 shadow-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  YENİ KİŞİSEL REKOR!
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}

              <div className="mt-4 mb-2">
                <Image
                  src="/logo.png"
                  alt="YÜDÜ Logo"
                  width={56}
                  height={56}
                  className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2 object-contain drop-shadow-md rounded-xl"
                />
                <div className="text-3xl sm:text-4xl mb-1">{commentary.emoji}</div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {mode === 'time' && timeLeft <= 0 ? 'Süre Doldu!' : commentary.title}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm mt-1 leading-relaxed">
                  {commentary.subtitle}
                </p>
                <div className="mt-3 text-xs bg-slate-950/60 border border-white/10 rounded-xl p-2.5 text-slate-300">
                  <span className="font-bold text-white">{rightItem.name}</span>: {' '}
                  <span className="text-amber-300 font-bold font-mono">{formatGameValue(rightItem, activeCategory.id)}</span> idi.
                </div>
              </div>

              {/* Score Display Card */}
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 sm:p-4 my-4 sm:my-5 grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-[11px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Skorun</span>
                  <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-400">{score}</span>
                </div>
                <div className="flex flex-col items-center border-l border-white/10">
                  <span className="text-[11px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Rekorun</span>
                  <span className="text-3xl sm:text-4xl font-black font-mono text-amber-300">{highScore}</span>
                </div>
              </div>

              {/* Share Component */}
              <div className="mb-4">
                <ShareButton score={score} categoryTitle={category.title} />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 sm:gap-3">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    restartWithMode(mode);
                  }}
                  className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
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
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl transition-all active:scale-95 text-xs sm:text-sm border border-white/15"
                >
                  Kategoriler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mid-game Stats Modal */}
      <StatsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
    </main>
  );
}
