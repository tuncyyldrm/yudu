import { CategoryConfig } from '@/types/game';

export const CATEGORIES: CategoryConfig[] = [
  { 
    id: 'ulke', 
    title: 'Ülke Nüfusları', 
    icon: '🌍', 
    description: 'Hangi ülkenin nüfusu daha yüksek?', 
    valueLabel: 'Nüfus',
    gradient: 'from-blue-600 to-cyan-500'
  },
  { 
    id: 'sehir', 
    title: 'Şehir Nüfusları', 
    icon: '🏙️', 
    description: 'Hangi şehrin nüfusu daha fazla?', 
    valueLabel: 'Nüfus',
    gradient: 'from-purple-600 to-indigo-500'
  },
  { 
    id: 'film', 
    title: 'Film Hasılatları', 
    icon: '🎬', 
    description: 'Hangi film gişede daha çok kazandı?', 
    valueLabel: 'Hasılat',
    gradient: 'from-amber-600 to-rose-500',
    badge: 'POPÜLER'
  },
  { 
    id: 'futbol', 
    title: 'Futbolcu Değerleri', 
    icon: '⚽', 
    description: 'Hangi yıldızın transfer piyasa değeri daha yüksek?', 
    valueLabel: 'Piyasa Değeri',
    gradient: 'from-emerald-600 to-teal-500',
    badge: 'POPÜLER'
  },
  { 
    id: 'sirket', 
    title: 'Dev Şirketler', 
    icon: '🏢', 
    description: 'Hangi dünya devinin piyasa değeri daha büyük?', 
    valueLabel: 'Piyasa Değeri',
    gradient: 'from-violet-600 to-blue-500',
    badge: 'YENİ'
  },
  { 
    id: 'sosyal', 
    title: 'Sosyal Medya', 
    icon: '📱', 
    description: 'Kimin Instagram veya YouTube takipçisi daha çok?', 
    valueLabel: 'Takipçi Sayısı',
    gradient: 'from-pink-600 to-rose-500',
    badge: 'YENİ'
  },
  { 
    id: 'araba', 
    title: 'Süper Arabalar', 
    icon: '🏎️', 
    description: 'Hangi efsane makinenin son hızı daha yüksek?', 
    valueLabel: 'Maksimum Hız',
    higherLabel: '▲ DAHA HIZLI',
    lowerLabel: '▼ DAHA YAVAŞ',
    gradient: 'from-red-600 to-amber-500',
    badge: 'YENİ'
  },
  { 
    id: 'tarih', 
    title: 'Tarihi Olaylar', 
    icon: '🕰️', 
    description: 'Hangi tarihi olay günümüze daha yakın zamanda gerçekleşti?', 
    valueLabel: 'Zaman',
    higherLabel: '▲ DAHA YENİ (SONRA)',
    lowerLabel: '▼ DAHA ESKİ (ÖNCE)',
    gradient: 'from-yellow-600 to-orange-500'
  },
  { 
    id: 'isim', 
    title: 'Popüler İsimler', 
    icon: '🌟', 
    description: 'Türkiye\'de hangi isim nüfusa daha çok kayıtlı?', 
    valueLabel: 'Kullanım Sayısı',
    gradient: 'from-teal-600 to-emerald-500'
  },
  { 
    id: 'karisik', 
    title: 'Karışık Mod', 
    icon: '🔀', 
    description: 'Tüm kategorilerden karışık sorularla genel kültürünü sına!', 
    valueLabel: 'Değer',
    gradient: 'from-fuchsia-600 to-indigo-600',
    badge: 'ULTRA'
  },
];