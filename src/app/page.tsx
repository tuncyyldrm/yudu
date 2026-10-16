'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CATEGORIES } from '@/data/categories';
import { SoundToggle } from '@/components/SoundToggle';
import { StatsModal } from '@/components/StatsModal';
import { Play, Zap, Trophy, Search } from 'lucide-react';
import { soundManager } from '@/lib/sound';

type FilterTab = 'all' | 'popular' | 'new' | 'geo' | 'culture';

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  const filteredCategories = useMemo(() => {
    return CATEGORIES.filter((cat) => {
      // Search filter
      const matchesSearch = 
        cat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Tab filter
      if (activeTab === 'popular') return cat.badge === 'POPÜLER' || cat.id === 'futbol' || cat.id === 'film';
      if (activeTab === 'new') return cat.badge === 'YENİ' || cat.badge === 'ULTRA';
      if (activeTab === 'geo') return cat.id === 'ulke' || cat.id === 'sehir' || cat.id === 'tarih';
      if (activeTab === 'culture') return cat.id === 'futbol' || cat.id === 'film' || cat.id === 'sosyal' || cat.id === 'isim';
      return true;
    });
  }, [searchTerm, activeTab]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/80 text-slate-100 flex flex-col justify-between p-3.5 sm:p-6 md:p-10 relative overflow-x-hidden selection:bg-amber-400 selection:text-slate-950">
      {/* Luminous colorful ambient light (not pitch black) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 bg-gradient-to-b from-amber-500/15 via-indigo-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 max-w-6xl mx-auto w-full flex justify-between items-center mb-6 sm:mb-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 shadow-md">
            <Image src="/logo.png" alt="YÜDÜ Logo" width={20} height={20} className="w-5 h-5 object-contain" priority />
            <span className="text-white text-xs font-black tracking-wider uppercase">
              YÜDÜ V2
            </span>
          </div>
          <span className="text-slate-400 text-xs font-bold hidden sm:inline">
            10 Kategori &bull; 3 Mod &bull; PWA Destekli
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              setIsStatsOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-xs font-bold text-amber-300 hover:text-white transition-all active:scale-95 shadow-md"
            title="İstatistikler & Başarımlar"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">İstatistikler</span>
          </button>

          <SoundToggle className="!bg-slate-800/90 !border-slate-700/80 text-slate-200" />
        </div>
      </header>

      {/* Hero Title Section */}
      <section className="relative z-10 max-w-4xl mx-auto w-full text-center mb-6 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-widest mb-3.5 shadow-sm">
          <Zap className="w-3.5 h-3.5 fill-amber-300" />
          Türkiye&apos;nin En Bağımlılık Yapan Karşılaştırma Oyunu
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-3">
          <Image 
            src="/logo.png" 
            alt="YÜDÜ Logo" 
            width={80} 
            height={80} 
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-xl hover:scale-105 transition-transform" 
            priority
          />
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-white drop-shadow-md">
            YÜ<span className="text-amber-400">DÜ</span>
          </h1>
        </div>

        <p className="text-slate-200 text-base sm:text-lg md:text-xl font-bold max-w-xl mx-auto leading-relaxed">
          Hangisi daha çok? Sezgine güven, <span className="text-emerald-400 font-black">Yüksek</span> veya <span className="text-rose-400 font-black">Düşük</span> de, rekoru kap!
        </p>
      </section>

      {/* Search & Filter Controls */}
      <section className="relative z-10 max-w-6xl mx-auto w-full mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/70 p-2.5 sm:p-3 rounded-2xl border border-slate-700/80 backdrop-blur-md shadow-lg">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Kategori ara (futbol, araba...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900/60 text-slate-300 hover:text-white'
              }`}
            >
              Tümü ({CATEGORIES.length})
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('popular');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                activeTab === 'popular'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900/60 text-slate-300 hover:text-white'
              }`}
            >
              🔥 Popüler
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('new');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                activeTab === 'new'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900/60 text-slate-300 hover:text-white'
              }`}
            >
              ✨ Yeni
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('geo');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'geo'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900/60 text-slate-300 hover:text-white'
              }`}
            >
              🌍 Coğrafya
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('culture');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'culture'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900/60 text-slate-300 hover:text-white'
              }`}
            >
              ⚽ Kültür & Spor
            </button>
          </div>
        </div>
      </section>

      {/* Category Selection Grid - Luminous and modern cards */}
      <section className="relative z-10 max-w-6xl mx-auto w-full mb-10">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm bg-slate-800/40 rounded-3xl border border-slate-700/60 p-8">
            Aradığınız kritere uygun kategori bulunamadı.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 md:gap-5">
            {filteredCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/oyunu/${cat.id}`}
                className="group relative bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/60 p-5 sm:p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 flex flex-col justify-between overflow-hidden shadow-md"
              >
                {/* Luminous accent line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cat.gradient || 'from-amber-400 to-rose-500'} opacity-80 group-hover:opacity-100 transition-opacity`} />

                <div>
                  <div className="flex items-start justify-between mb-3.5">
                    <div className="text-3xl sm:text-4xl p-2.5 rounded-2xl bg-slate-900/80 border border-slate-700/80 group-hover:scale-110 transition-transform duration-300 w-fit shadow-inner">
                      {cat.icon}
                    </div>
                    {cat.badge && (
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
                        {cat.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-black mb-1 text-white group-hover:text-amber-300 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">
                    Ölçü: <span className="text-slate-200">{cat.valueLabel}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 group-hover:text-amber-300 uppercase tracking-wider">
                    Hemen Oyna
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full text-center text-slate-400 text-xs py-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>YÜDÜ &bull; Higher Lower Türkiye Edisyonu</p>
        <p className="text-slate-400">Arkadaşlarınla kapış, rekorları zorla!</p>
      </footer>

      {/* Stats Modal */}
      <StatsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
    </main>
  );
}