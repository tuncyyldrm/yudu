import { GameItem } from '@/types/game';

export function formatGameValue(item: GameItem, categoryId?: string): string {
  const cat = categoryId || item.category;

  if (cat === 'tarih') {
    if (item.value < 0) {
      return `M.Ö. ${Math.abs(item.value).toLocaleString('tr-TR')} yılı`;
    } else {
      return `M.S. ${item.value.toLocaleString('tr-TR')} yılı`;
    }
  }

  // Format large numbers cleanly
  return `${item.value.toLocaleString('tr-TR')} ${item.unit}`;
}

export function formatShortValue(val: number): string {
  if (Math.abs(val) >= 1_000_000_000) {
    return (val / 1_000_000_000).toFixed(1).replace('.0', '') + ' Mr';
  }
  if (Math.abs(val) >= 1_000_000) {
    return (val / 1_000_000).toFixed(1).replace('.0', '') + ' Mn';
  }
  if (Math.abs(val) >= 1_000) {
    return (val / 1_000).toFixed(1).replace('.0', '') + ' B';
  }
  return val.toString();
}
