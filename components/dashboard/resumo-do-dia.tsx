import Link from "next/link";
import { CalendarDays, ChevronRight, MessageCircle, Repeat } from "lucide-react";
import { cn } from "@/lib/cn";

function Item({
  href,
  icon,
  count,
  singular,
  plural,
  nenhum,
}: {
  href: string;
  icon: React.ReactNode;
  count: number;
  singular: string;
  plural: string;
  nenhum: string;
}) {
  const temAlgo = count > 0;
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-xl border-2 px-4 py-2.5 transition-colors",
        temAlgo
          ? "border-brand-200 bg-brand-50 text-brand-900 hover:border-brand-500"
          : "border-stone-200 bg-white text-stone-500 hover:border-stone-300",
      )}
    >
      <span className={temAlgo ? "text-brand-700" : "text-stone-400"}>
        {icon}
      </span>
      <span className="flex-1 text-base font-semibold">
        {temAlgo ? `${count} ${count === 1 ? singular : plural}` : nenhum}
      </span>
      <ChevronRight className="size-5 shrink-0 opacity-60" />
    </Link>
  );
}

/** Quadro "Hoje": o que precisa de atenção agora, com atalho para cada tela. */
export function ResumoDoDia({
  visitasHoje,
  conversasSemResposta,
  permutasParaAprovar,
}: {
  visitasHoje: number;
  conversasSemResposta: number;
  permutasParaAprovar: number;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-xl font-bold text-stone-900">
        Hoje{" "}
        <span className="text-base font-semibold text-stone-500">
          — o que precisa de atenção
        </span>
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Item
          href="/agenda"
          icon={<CalendarDays className="size-6" />}
          count={visitasHoje}
          singular="visita hoje"
          plural="visitas hoje"
          nenhum="Nenhuma visita hoje"
        />
        <Item
          href="/conversas"
          icon={<MessageCircle className="size-6" />}
          count={conversasSemResposta}
          singular="conversa sem resposta"
          plural="conversas sem resposta"
          nenhum="Nenhuma conversa esperando"
        />
        <Item
          href="/permutas-admin"
          icon={<Repeat className="size-6" />}
          count={permutasParaAprovar}
          singular="permuta para aprovar"
          plural="permutas para aprovar"
          nenhum="Nenhuma permuta esperando"
        />
      </div>
    </section>
  );
}
