export function getGameOverCommentary(score: number): { title: string; subtitle: string; emoji: string } {
  if (score === 0) {
    return {
      title: "İlk soruda mı elendin?!",
      subtitle: "Gözün kapalı bastın herhalde. Bir şans daha ver kendine!",
      emoji: "🤦‍♂️"
    };
  }
  if (score <= 2) {
    return {
      title: "Isınma turu sayılır...",
      subtitle: "Fena başlamadın ama bu skorla masada hava atamazsın.",
      emoji: "🤏"
    };
  }
  if (score <= 5) {
    return {
      title: "Fena gitmiyordun!",
      subtitle: "Ufak bir dikkatsizlik seriyi bozdu. Tekrar dene, bu sefer geçersin.",
      emoji: "⚡"
    };
  }
  if (score <= 9) {
    return {
      title: "Helal olsun!",
      subtitle: "Genel kültürün konuşuyor! Ciddi bir seri yakaladın.",
      emoji: "🎯"
    };
  }
  if (score <= 15) {
    return {
      title: "Canavar mısın nesin?!",
      subtitle: "Bu hafıza karşısında şapka çıkartılır. Arkadaşlarına meydan oku!",
      emoji: "🔥"
    };
  }
  return {
    title: "EFSANE SEVİYE!",
    subtitle: "Sen bu oyunu bitirdin resmen. Bu rekoru kimse kolay kolay geçemez!",
    emoji: "👑"
  };
}

export function getStreakShoutout(streak: number): string | null {
  if (streak === 3) return "🔥 3 Seri! Isınıyorsun";
  if (streak === 5) return "⚡ 5 Seri! Ateş Ediyorsun";
  if (streak === 8) return "🚀 8 Seri! Durdurulamıyor";
  if (streak === 10) return "🧠 10 Seri! Zehir Gibisin";
  if (streak === 15) return "🏆 15 Seri! Efsane Modu Açık";
  if (streak >= 20) return `👑 ${streak} Seri! Resmen Makine!`;
  return null;
}
