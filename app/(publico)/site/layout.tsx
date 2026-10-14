export const metadata = {
  title: { absolute: "FC Imóveis — Imobiliária em Bragança Paulista/SP" },
  description:
    "Casas, apartamentos, chácaras e terrenos em Bragança Paulista e região. Atendimento direto com os corretores Cátia e Francisco.",
  // Prévia: SÓ a seção /site fica fora do Google por enquanto. Tirar esta
  // linha quando o site for oficializado — permutas/agendar/cidade já estão
  // no ar e continuam indexáveis (o noindex não pode ir no layout público).
  robots: { index: false, follow: false },
};

/** O site gerencia a largura das próprias seções (hero full-width etc.). */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
