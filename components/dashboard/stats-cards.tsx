import Link from "next/link";
import { Building2, CheckCircle2, FileEdit, KeyRound } from "lucide-react";

/** Faixa de números do painel: células com divisórias finas sobre o verde
 *  escuro do hero. Cada célula é um link que já aplica o filtro certo. */
export function StatsCards({
  total,
  ativos,
  rascunhos,
  negociados,
  permutasPendentes,
  matchesNovos,
  pedidosEndereco,
}: {
  total: number;
  ativos: number;
  rascunhos: number;
  negociados: number;
  permutasPendentes: number;
  matchesNovos: number;
  pedidosEndereco: number;
}) {
  const permutaTotal = permutasPendentes + matchesNovos + pedidosEndereco;
  const cards = [
    {
      label: "Imóveis na carteira",
      value: total,
      icon: Building2,
      href: "/painel",
    },
    {
      label: "Anunciados (ativos)",
      value: ativos,
      icon: CheckCircle2,
      href: "/painel?status=ATIVO",
    },
    {
      label: "Rascunhos para concluir",
      value: rascunhos,
      icon: FileEdit,
      href: "/painel?status=RASCUNHO",
    },
    {
      label: "Vendidos / Alugados",
      value: negociados,
      icon: CheckCircle2,
      href: "/painel?status=VENDIDO",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-px bg-white/10 lg:grid-cols-5">
      {cards.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          className="bg-brand-950 px-5 py-5 transition-colors hover:bg-brand-900 sm:px-6"
        >
          <span className="block font-display text-4xl font-bold leading-none text-white">
            {c.value}
          </span>
          <span className="mt-2.5 flex items-center gap-1.5 text-sm font-semibold text-brand-200">
            <c.icon className="size-4 shrink-0 text-brand-300" />
            {c.label}
          </span>
        </Link>
      ))}
      <Link
        href="/permutas-admin"
        className="col-span-2 bg-brand-950 px-5 py-5 transition-colors hover:bg-brand-900 sm:px-6 lg:col-span-1"
      >
        <span className="block font-display text-4xl font-bold leading-none text-gold-300">
          {permutaTotal}
        </span>
        <span className="mt-2.5 flex items-center gap-1.5 text-sm font-semibold text-gold-200">
          <KeyRound className="size-4 shrink-0 text-gold-300" />
          Permutas para cuidar
        </span>
        {permutaTotal > 0 && (
          <span className="mt-1 block text-sm text-gold-200/80">
            {permutasPendentes} aprov. · {matchesNovos} match
            {matchesNovos === 1 ? "" : "es"} · {pedidosEndereco} endereço
          </span>
        )}
      </Link>
    </div>
  );
}
