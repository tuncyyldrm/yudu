import { Metadata } from 'next';
import { DailyClient } from './DailyClient';

export const metadata: Metadata = {
  title: "Günün YÜDÜ'sü - Günlük Karşılaştırma Mücadelesi",
  description: "Bugün tüm Türkiye aynı 10 soruyu çözüyor! Sen 10'da kaç yapacaksın? Günlük YÜDÜ mücadelesine hemen katıl.",
  openGraph: {
    title: "Günün YÜDÜ'sü - Günlük Karşılaştırma Mücadelesi",
    description: "Tüm Türkiye aynı 10 soruyu çözüyor! Hemen tahmin et, skorunu arkadaşlarınla paylaş.",
    images: ['/logo.png'],
  },
};

export default function DailyPage() {
  return <DailyClient />;
}
