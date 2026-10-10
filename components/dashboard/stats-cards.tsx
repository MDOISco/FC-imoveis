import Link from "next/link";
import { Building2, CheckCircle2, FileEdit, KeyRound } from "lucide-react";

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
      href: "/",
      accent: "text-brand-700 bg-brand-50",
    },
    {
      label: "Anunciados (ativos)",
      value: ativos,
      icon: CheckCircle2,
      href: "/?status=ATIVO",
      accent: "text-brand-700 bg-brand-50",
    },
    {
      label: "Rascunhos para concluir",
      value: rascunhos,
      icon: FileEdit,
      href: "/?status=RASCUNHO",
      accent: "text-amber-700 bg-amber-50",
    },
    {
      label: "Vendidos / Alugados",
      value: negociados,
      icon: CheckCircle2,
      href: "/?status=VENDIDO",
      accent: "text-purple-700 bg-purple-50",
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <span
            className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${c.accent}`}
          >
            <c.icon className="size-6" />
          </span>
          <span>
            <span className="block text-3xl font-extrabold leading-none text-stone-900">
              {c.value}
            </span>
            <span className="mt-1 block text-sm font-semibold text-stone-500">
              {c.label}
            </span>
          </span>
        </Link>
      ))}
      <Link
        href="/permutas-admin"
        className="flex items-center gap-4 rounded-2xl border border-gold-300 bg-gold-50 p-5 shadow-sm transition-shadow hover:shadow-md"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gold-400 text-gold-950">
          <KeyRound className="size-6" />
        </span>
        <span>
          <span className="block text-3xl font-extrabold leading-none text-gold-900">
            {permutaTotal}
          </span>
          <span className="mt-1 block text-sm font-semibold text-gold-800">
            Permutas para cuidar
            {permutaTotal > 0 &&
              ` (${permutasPendentes} aprov. · ${matchesNovos} match${matchesNovos === 1 ? "" : "es"} · ${pedidosEndereco} endereço)`}
          </span>
        </span>
      </Link>
    </div>
  );
}
