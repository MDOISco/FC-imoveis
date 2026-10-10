import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
