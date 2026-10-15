import Link from 'next/link';
import { CATEGORIES } from '@/data/categories';
import { SoundToggle } from '@/components/SoundToggle';
import { Play, Flame, Zap, Trophy } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 md:p-12 relative overflow-hidden select-none">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-gradient-to-b from-amber-500/10 via-rose-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 max-w-6xl mx-auto w-full flex justify-between items-center mb-8 sm:mb-12">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-white text-xs font-black tracking-wider uppercase">
              YÜDÜ V2
            </span>
          </div>
          <span className="text-slate-400 text-xs font-bold hidden sm:inline">
            10 Kategori &bull; 3 Mod &bull; Full Ekran
          </span>
        </div>
        <SoundToggle className="!bg-white/10 !border-white/15 text-white" />
      </header>

      {/* Hero Title Section */}
      <section className="relative z-10 max-w-4xl mx-auto w-full text-center mb-10 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(251,191,36,0.15)]">
          <Zap className="w-3.5 h-3.5 fill-amber-300" />
          Türkiye&apos;nin En Bağımlılık Yapan Karşılaştırma Oyunu
        </div>

        <h1 className="text-6xl sm:text-7xl md:text-9xl font-black tracking-tighter text-white mb-4 drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
          YÜ<span className="text-amber-400">DÜ</span>
        </h1>

        <p className="text-slate-300 text-lg sm:text-xl md:text-2xl font-bold max-w-xl mx-auto leading-relaxed">
          Hangisi daha çok? Sezgine güven, <span className="text-emerald-400">Yüksek</span> veya <span className="text-rose-400">Düşük</span> de, rekoru kap!
        </p>
      </section>

      {/* Category Selection Grid */}
      <section className="relative z-10 max-w-6xl mx-auto w-full mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
            <Trophy className="w-5 h-5 text-amber-400" />
            Kategori Seç & Başla
          </h2>
          <span className="text-xs text-slate-400 font-bold bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
            {CATEGORIES.length} Kategori
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/oyunu/${cat.id}`}
              className="group relative bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-amber-400/50 p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_10px_30px_rgba(251,191,36,0.15)] flex flex-col justify-between overflow-hidden"
            >
              {/* Subtle accent line */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cat.gradient || 'from-amber-400 to-rose-500'} opacity-60 group-hover:opacity-100 transition-opacity`} />

              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl p-2.5 rounded-2xl bg-black/40 border border-white/10 group-hover:scale-110 transition-transform duration-300 w-fit">
                    {cat.icon}
                  </div>
                  {cat.badge && (
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
                      {cat.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-black mb-1.5 text-white group-hover:text-amber-300 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">
                  Birim: <span className="text-slate-300">{cat.valueLabel}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 group-hover:text-amber-300 uppercase tracking-wider">
                  Hemen Oyna
                  <Play className="w-3.5 h-3.5 fill-current" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full text-center text-slate-500 text-xs py-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>YÜDÜ &bull; Higher Lower Türkiye Edisyonu</p>
        <p className="text-slate-600">Arkadaşlarınla kapış, rekorları zorla!</p>
      </footer>
    </main>
  );
}