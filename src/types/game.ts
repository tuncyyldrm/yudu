export type CategoryType = 
  | 'ulke' 
  | 'sehir' 
  | 'film' 
  | 'tarih' 
  | 'futbol' 
  | 'isim'
  | 'sirket'
  | 'araba'
  | 'sosyal'
  | 'karisik';

export type GameMode = 'classic' | 'lives' | 'time';

export interface GameItem {
  id: string;
  name: string;
  value: number;
  unit: string;
  image?: string;
  description?: string;
  category?: CategoryType;
}

export interface CategoryConfig {
  id: CategoryType;
  title: string;
  icon: string;
  description: string;
  valueLabel: string;
  higherLabel?: string;
  lowerLabel?: string;
  badge?: string;
  gradient?: string;
}