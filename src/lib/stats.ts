'use client';

export interface UserStats {
  gamesPlayed: number;
  totalCorrect: number;
  highestStreak: number;
  bestScores: Record<string, number>;
  unlockedBadges: string[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const ALL_BADGES: Badge[] = [
  { id: 'first_5', title: 'Isınma Turu', description: 'Tek oyunda 5 seri galibiyet elde et', icon: '🔥' },
  { id: 'streak_10', title: 'Bilgi Canavarı', description: 'Tek oyunda 10 seri galibiyete ulaş', icon: '⚡' },
  { id: 'streak_20', title: 'Efsane Hafıza', description: '20 seri galibiyet ile rekor kır', icon: '👑' },
  { id: 'time_rush', title: 'Hız Tutkunu', description: 'Süre modunda en az 10 skor yap', icon: '⏱️' },
  { id: 'shield_hero', title: 'Kalkan Ustası', description: 'Kalkan jokerini kullanarak seriyi kurtar', icon: '🛡️' },
  { id: 'games_10', title: 'Sadık Oyuncu', description: 'Toplam 10 oyun tamamla', icon: '🎮' },
  { id: 'games_50', title: 'Müdavim', description: 'Toplam 50 oyun tamamla', icon: '🏆' },
];

const STATS_STORAGE_KEY = 'yudu_user_stats_v1';

export function getStats(): UserStats {
  if (typeof window === 'undefined') {
    return {
      gamesPlayed: 0,
      totalCorrect: 0,
      highestStreak: 0,
      bestScores: {},
      unlockedBadges: [],
    };
  }
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) {
      return {
        gamesPlayed: 0,
        totalCorrect: 0,
        highestStreak: 0,
        bestScores: {},
        unlockedBadges: [],
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      gamesPlayed: 0,
      totalCorrect: 0,
      highestStreak: 0,
      bestScores: {},
      unlockedBadges: [],
    };
  }
}

export function saveStats(stats: UserStats) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export function recordGameResult({
  score,
  streak,
  mode,
  categoryId,
  shieldUsedAndSaved,
}: {
  score: number;
  streak: number;
  mode: string;
  categoryId: string;
  shieldUsedAndSaved?: boolean;
}): { newBadges: Badge[] } {
  const current = getStats();
  const next: UserStats = {
    ...current,
    gamesPlayed: current.gamesPlayed + 1,
    totalCorrect: current.totalCorrect + score,
    highestStreak: Math.max(current.highestStreak, streak),
    bestScores: {
      ...current.bestScores,
      [categoryId]: Math.max(current.bestScores[categoryId] || 0, score),
    },
    unlockedBadges: [...current.unlockedBadges],
  };

  const newlyUnlocked: Badge[] = [];

  const checkBadge = (badgeId: string, condition: boolean) => {
    if (condition && !next.unlockedBadges.includes(badgeId)) {
      next.unlockedBadges.push(badgeId);
      const found = ALL_BADGES.find((b) => b.id === badgeId);
      if (found) newlyUnlocked.push(found);
    }
  };

  checkBadge('first_5', streak >= 5 || score >= 5);
  checkBadge('streak_10', streak >= 10 || score >= 10);
  checkBadge('streak_20', streak >= 20 || score >= 20);
  checkBadge('time_rush', mode === 'time' && score >= 10);
  checkBadge('shield_hero', !!shieldUsedAndSaved);
  checkBadge('games_10', next.gamesPlayed >= 10);
  checkBadge('games_50', next.gamesPlayed >= 50);

  saveStats(next);
  return { newBadges: newlyUnlocked };
}
