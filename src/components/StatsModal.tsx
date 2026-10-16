'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Flame, Target, Award, CheckCircle2, Lock } from 'lucide-react';
import { getStats, ALL_BADGES } from '@/lib/stats';
import { CATEGORIES } from '@/data/categories';
import { soundManager } from '@/lib/sound';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatsModal({ isOpen, onClose }: StatsModalProps) {
  if (!isOpen) return null;

  const stats = getStats();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          className="bg-slate-900 border border-white/15 rounded-3xl max-w-xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto text-white shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl md:text-2xl font-black">İstatistikler & Başarımlar</h2>
            </div>
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-black/50 border border-white/10 p-3.5 rounded-2xl flex flex-col items-center text-center">
              <Target className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Toplam Doğru</span>
              <span className="text-xl md:text-2xl font-black font-mono text-emerald-400">{stats.totalCorrect}</span>
            </div>

            <div className="bg-black/50 border border-white/10 p-3.5 rounded-2xl flex flex-col items-center text-center">
              <Flame className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">En İyi Seri</span>
              <span className="text-xl md:text-2xl font-black font-mono text-amber-400">{stats.highestStreak}</span>
            </div>

            <div className="bg-black/50 border border-white/10 p-3.5 rounded-2xl flex flex-col items-center text-center">
              <Award className="w-4 h-4 text-indigo-400 mb-1" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Oynanan Oyun</span>
              <span className="text-xl md:text-2xl font-black font-mono text-indigo-400">{stats.gamesPlayed}</span>
            </div>
          </div>

          {/* Category Bests */}
          <div className="mb-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <span>🏆 Kategori Rekorların</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const best = stats.bestScores[cat.id] || 0;
                return (
                  <div
                    key={cat.id}
                    className="bg-white/5 border border-white/10 p-2.5 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">{cat.icon}</span>
                      <span className="text-xs font-bold truncate">{cat.title}</span>
                    </div>
                    <span className="font-mono font-black text-amber-400 text-sm ml-2">{best}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Badges / Achievements */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <span>🎖️ Rozetler & Görevler</span>
              <span className="text-amber-400">({stats.unlockedBadges.length}/{ALL_BADGES.length})</span>
            </h3>
            <div className="space-y-2">
              {ALL_BADGES.map((badge) => {
                const unlocked = stats.unlockedBadges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                      unlocked
                        ? 'bg-amber-400/10 border-amber-400/40 shadow-sm'
                        : 'bg-white/5 border-white/5 opacity-55'
                    }`}
                  >
                    <div className="text-2xl p-2 rounded-xl bg-black/40 border border-white/10">
                      {badge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white truncate">{badge.title}</h4>
                        {unlocked && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{badge.description}</p>
                    </div>
                    <div>
                      {unlocked ? (
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full">
                          Kazanıldı
                        </span>
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
