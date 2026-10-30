import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  // O site público virou a página inicial ("/"); o painel da equipe foi para
  // /painel. Links antigos do site (/site, /site/imovel/…) continuam valendo.
  async redirects() {
    return [
      { source: "/site", destination: "/", permanent: true },
      { source: "/site/imovel/:id", destination: "/imovel/:id", permanent: true },
    ];
  },
};

export default nextConfig;
