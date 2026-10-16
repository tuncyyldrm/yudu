import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "YÜDÜ - Yüksek mi, Düşük mü?",
  description: "Türkiye'nin en popüler karşılaştırma ve trivia oyunu. Ülkeler, filmler, futbolcular, süper arabalar ve daha fazlası!",
  keywords: ["yüdü", "higher lower game", "yüksek mi düşük mü", "tahmin oyunu", "türkiye trivia"],
  authors: [{ name: "YÜDÜ Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "YÜDÜ",
  },
  openGraph: {
    title: "YÜDÜ - Yüksek mi, Düşük mü?",
    description: "Kategorini seç, sezgilerini sına ve rekorları altüst et!",
    type: "website",
    locale: "tr_TR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-950 text-white antialiased selection:bg-indigo-500 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}