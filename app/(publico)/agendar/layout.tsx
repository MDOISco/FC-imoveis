export const metadata = {
  title: "Agendar visita · FC Imóveis",
  description:
    "Agende sua visita a um imóvel ou um atendimento na FC Imóveis, em Bragança Paulista, escolhendo o dia e o horário.",
};

export default function AgendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">{children}</div>
  );
}
