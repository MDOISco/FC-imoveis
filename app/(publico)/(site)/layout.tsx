export const metadata = {
  title: { absolute: "FC Imóveis — Imobiliária em Bragança Paulista/SP" },
  description:
    "Casas, apartamentos, chácaras e terrenos em Bragança Paulista e região. Atendimento direto com os corretores Cátia e Francisco.",
  // Site oficial (página inicial do domínio): aparece no Google.
};

/** O site gerencia a largura das próprias seções (hero full-width etc.). */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
