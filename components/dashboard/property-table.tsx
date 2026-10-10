import Link from "next/link";
import { Camera, Pencil, Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  PROPERTY_TYPE_LABELS,
  PURPOSE_LABELS,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
} from "@/lib/constants";
import { displayTitle, priceLabel, specsSummary } from "@/lib/property-display";
import type { PropertyWithRelations } from "./property-card";
import type { Broker } from "@prisma/client";

type Row = PropertyWithRelations & { broker: Broker | null };

/** Modo LISTA: todos os imóveis numa tabela de leitura rápida. */
export function PropertyTable({ properties }: { properties: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
      <table className="w-full min-w-[900px] text-left">
        <thead>
          <tr className="border-b-2 border-stone-100 text-sm font-bold uppercase tracking-wide text-stone-500">
            <th className="px-4 py-3">Imóvel</th>
            <th className="px-4 py-3">Tipo / Finalidade</th>
            <th className="px-4 py-3">Detalhes</th>
            <th className="px-4 py-3">Valor</th>
            <th className="px-4 py-3">Corretor</th>
            <th className="px-4 py-3">Situação</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {properties.map((p) => {
            const cover = p.photos.find((f) => f.isCover) ?? p.photos[0];
            const isDraft = p.status === "RASCUNHO";
            const href = isDraft
              ? `/imoveis/${p.id}/editar?etapa=${Math.min(p.wizardStep + 1, 8)}`
              : `/imoveis/${p.id}`;
            return (
              <tr
                key={p.id}
                className="border-b border-stone-100 align-middle transition-colors last:border-0 hover:bg-brand-50/40"
              >
                <td className="px-4 py-3">
                  <Link href={href} className="flex items-center gap-3">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/arquivos/${cover.thumbPath}?v=${cover.updatedAt.getTime()}`}
                        alt=""
                        className="h-14 w-20 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-400">
                        <Camera className="size-6" />
                      </span>
                    )}
                    <span>
                      <span className="block text-sm font-bold text-stone-400">
                        {p.refCode}
                        {p.acceptsTrade && (
                          <Repeat className="ml-1.5 inline size-3.5 text-gold-600" />
                        )}
                      </span>
                      <span className="block max-w-72 truncate font-bold text-stone-900 hover:text-brand-800">
                        {displayTitle(p)}
                      </span>
                      <span className="block text-sm text-stone-500">
                        {p.neighborhood
                          ? `${p.neighborhood}, ${p.city}`
                          : p.city}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-base text-stone-700">
                  {p.propertyType ? PROPERTY_TYPE_LABELS[p.propertyType] : "—"}
                  <span className="block text-sm text-stone-500">
                    {p.purpose ? PURPOSE_LABELS[p.purpose] : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-base text-stone-700">
                  {specsSummary(p) || "—"}
                </td>
                <td className="px-4 py-3 text-base font-bold text-brand-800">
                  {priceLabel(p)}
                </td>
                <td className="px-4 py-3 text-base text-stone-700">
                  {p.broker?.name?.split(" ")[0] ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_BADGE_CLASSES[p.status]}>
                    {STATUS_LABELS[p.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={href}
                    className={
                      isDraft
                        ? "inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-gold-400 px-4 font-semibold text-gold-950 hover:bg-gold-300"
                        : "inline-flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-stone-200 px-4 font-semibold text-stone-700 hover:border-brand-500 hover:text-brand-800"
                    }
                  >
                    <Pencil className="size-4" />
                    {isDraft ? "Continuar" : "Abrir"}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
