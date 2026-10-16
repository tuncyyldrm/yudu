import { GameItem } from '@/types/game';
import { GAME_DATA } from '@/data/items';

// Simple deterministic hash for a date string like "2026-10-16"
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

// Generate deterministic 11 items (10 question pairs) for a specific date
export function getDailyChallengeItems(dateStr: string): GameItem[] {
  const seed = hashString(`yudu-daily-${dateStr}`);
  const rng = createRng(seed);

  // Pool from all items with distinct values
  const allPool = [...GAME_DATA.karisik];

  // Fisher-Yates shuffle with seeded RNG
  const shuffled = [...allPool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Pick 11 items ensuring no two consecutive items have equal values
  const selected: GameItem[] = [];
  for (const item of shuffled) {
    if (selected.length === 0) {
      selected.push(item);
    } else {
      const prev = selected[selected.length - 1];
      // Only add if not identical and not equal value to make comparison interesting
      if (prev.id !== item.id && prev.value !== item.value) {
        selected.push(item);
      }
    }
    if (selected.length >= 11) break;
  }

  return selected;
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
