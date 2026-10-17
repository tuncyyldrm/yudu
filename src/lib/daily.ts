import { GameItem, CategoryConfig, CategoryType } from '@/types/game';
import { GAME_DATA } from '@/data/items';
import { CATEGORIES } from '@/data/categories';

export const BASE_CATEGORIES: CategoryType[] = [
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

// Simple deterministic hash for a date string like "2026-10-17"
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Seeded PRNG (Mulberry32)
export function createRng(seed: number) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDailyChallengeNumber(dateStr: string): number {
  const epoch = new Date('2026-01-01').getTime();
  const current = new Date(dateStr).getTime();
  const diffDays = Math.max(1, Math.floor((current - epoch) / (1000 * 60 * 60 * 24)));
  return diffDays;
}

export interface DailyQuestion {
  category: CategoryConfig;
  leftItem: GameItem;
  rightItem: GameItem;
}

// Generate deterministic 10 balanced questions for a specific date
// Each question compares 2 items belonging to the SAME category so units and metrics match!
export function getDailyChallengeQuestions(dateStr: string): DailyQuestion[] {
  const seed = hashString(`yudu-daily-v2-${dateStr}`);
  const rng = createRng(seed);

  // We want 10 questions. Start with all 9 base categories shuffled, then add 1 more popular category.
  const categoriesPool: CategoryType[] = [...BASE_CATEGORIES];
  // Shuffle categories pool
  for (let i = categoriesPool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [categoriesPool[i], categoriesPool[j]] = [categoriesPool[j], categoriesPool[i]];
  }

  // 10th category: pick between film, futbol, or araba
  const bonusCats: CategoryType[] = ['film', 'futbol', 'araba'];
  const bonus = bonusCats[Math.floor(rng() * bonusCats.length)];
  const finalCategoryOrder = [...categoriesPool, bonus];

  const questions: DailyQuestion[] = [];

  for (const catId of finalCategoryOrder) {
    const config = CATEGORIES.find((c) => c.id === catId);
    if (!config) continue;

    const items = GAME_DATA[catId] || [];
    if (items.length < 2) continue;

    // Pick 2 distinct items from this category with distinct values
    const shuffledItems = [...items];
    for (let i = shuffledItems.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
    }

    const left = shuffledItems[0];
    // Find right item with a different value so the comparison is clear and fun
    let right = shuffledItems[1];
    for (let i = 1; i < shuffledItems.length; i++) {
      if (shuffledItems[i].value !== left.value) {
        right = shuffledItems[i];
        break;
      }
    }

    questions.push({
      category: config,
      leftItem: left,
      rightItem: right,
    });

    if (questions.length >= 10) break;
  }

  return questions;
}

export interface DailyResult {
  date: string;
  dayNumber: number;
  score: number;
  total: number;
  results: boolean[]; // array of 10 booleans (true = correct)
  completedAt: string;
}

const DAILY_STORAGE_KEY = 'yudu_daily_record';

export function getStoredDailyResult(dateStr: string): DailyResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(`${DAILY_STORAGE_KEY}_${dateStr}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to get daily result', e);
  }
  return null;
}

export function saveStoredDailyResult(result: DailyResult): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${DAILY_STORAGE_KEY}_${result.date}`, JSON.stringify(result));
  } catch (e) {
    console.error('Failed to save daily result', e);
  }
}

export function generateDailyShareText(result: DailyResult): string {
  const squares = result.results.map((r) => (r ? '🟩' : '🟥')).join('');
  const emojiRating =
    result.score === 10
      ? '👑 EFSANEVİ'
      : result.score >= 8
      ? '🔥 HARİKA'
      : result.score >= 5
      ? '👏 İYİ'
      : '🎯 DENEDİ';

  return `YÜDÜ Günlük #${result.dayNumber} ${emojiRating}\nSkor: ${result.score}/${result.total}\n\n${squares}\n\nBugünün mücadelesini sen de oyna:\nhttps://yudu.app/gunluk`;
}
