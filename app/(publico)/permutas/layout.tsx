export const metadata = {
  title: "Permutas · FC Imóveis",
  description:
    "Troque seu imóvel em Bragança Paulista: cadastre o seu, veja opções de permuta e dê match com a chave dourada.",
};

export default function PermutasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">{children}</div>
  );
}
