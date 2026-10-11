import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Playfair Display (OFL) hospedada no próprio repositório: o build de
// produção na VPS não depende de rede para baixar fontes.
const playfair = localFont({
  src: "./fonts/playfair-display-latin-var.woff2",
  weight: "400 900",
  display: "swap",
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: {
    default: "FC Imóveis",
    template: "%s · FC Imóveis",
  },
  description:
    "FC Imóveis — Imobiliária em Bragança Paulista/SP. Dashboard de cadastro e permutas de imóveis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={playfair.variable}>
      <body>{children}</body>
    </html>
  );
}
