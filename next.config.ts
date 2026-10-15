import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/index.html",
        destination: "/",
        permanent: true,
      },
      {
        source: "/ulke.html",
        destination: "/oyunu/ulke",
        permanent: true,
      },
      {
        source: "/sehir.html",
        destination: "/oyunu/sehir",
        permanent: true,
      },
      {
        source: "/film.html",
        destination: "/oyunu/film",
        permanent: true,
      },
      {
        source: "/futbol.html",
        destination: "/oyunu/futbol",
        permanent: true,
      },
      {
        source: "/tarih.html",
        destination: "/oyunu/tarih",
        permanent: true,
      },
      {
        source: "/isim.html",
        destination: "/oyunu/isim",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
