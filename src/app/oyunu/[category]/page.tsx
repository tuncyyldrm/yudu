import { CATEGORIES } from '@/data/categories';
import { GameClient } from './GameClient';

export function generateStaticParams() {
  return CATEGORIES.map((cat) => ({
    category: cat.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const current = CATEGORIES.find((c) => c.id === category);
  return {
    title: current ? `${current.title} - YÜDÜ` : 'YÜDÜ - Yüksek mi Düşük mü?',
    description: current?.description || 'Yüksek mi, Düşük mü? Tahmin etmeye başla!',
  };
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return <GameClient categoryId={category} />;
}