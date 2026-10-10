import Link from "next/link";
import { Users } from "lucide-react";
import { cn } from "@/lib/cn";

export type BrokerChip = {
  id: string;
  name: string;
  count: number;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Um toque para ver os imóveis de cada corretor (chips grandes com contagem). */
export function BrokerChips({
  brokers,
  total,
  selected,
  buildHref,
}: {
  brokers: BrokerChip[];
  total: number;
  selected: string;
  buildHref: (corretorId: string) => string;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-stone-500">
        <Users className="size-4" /> Imóveis por corretor
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href={buildHref("")}
          aria-current={selected === "" ? "true" : undefined}
          className={cn(
            "inline-flex min-h-12 items-center gap-2 rounded-xl border-2 px-4 font-semibold transition-colors",
            selected === ""
              ? "border-brand-700 bg-brand-700 text-white"
              : "border-stone-200 bg-white text-stone-700 hover:border-brand-400",
          )}
        >
          Todos
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-sm font-bold",
              selected === ""
                ? "bg-white/20 text-white"
                : "bg-stone-100 text-stone-600",
            )}
          >
            {total}
          </span>
        </Link>
        {brokers.map((b) => {
          const active = selected === b.id;
          return (
            <Link
              key={b.id}
              href={buildHref(b.id)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "inline-flex min-h-12 items-center gap-2.5 rounded-xl border-2 px-3.5 font-semibold transition-colors",
                active
                  ? "border-brand-700 bg-brand-700 text-white"
                  : "border-stone-200 bg-white text-stone-700 hover:border-brand-400",
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sm font-extrabold",
                  active
                    ? "bg-gold-400 text-gold-950"
                    : "bg-brand-100 text-brand-900",
                )}
              >
                {initials(b.name)}
              </span>
              {b.name.split(" ")[0]}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-sm font-bold",
                  active
                    ? "bg-white/20 text-white"
                    : "bg-stone-100 text-stone-600",
                )}
              >
                {b.count}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
