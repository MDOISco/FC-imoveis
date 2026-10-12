import Link from "next/link";
import { Camera, Pencil, Repeat, UserRound } from "lucide-react";
import type { Broker, Photo, PortalPublication, Property } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { DeleteDraftButton } from "@/components/dashboard/delete-draft-button";
import {
  PORTAL_LABELS,
  PROPERTY_TYPE_LABELS,
  PURPOSE_LABELS,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
} from "@/lib/constants";
import {
  displayTitle,
  priceLabel,
  specsSummary,
} from "@/lib/property-display";

export type PropertyWithRelations = Property & {
  photos: Photo[];
  publications: PortalPublication[];
  broker?: Broker | null;
};

export function PropertyCard({ property }: { property: PropertyWithRelations }) {
  const cover =
    property.photos.find((f) => f.isCover) ?? property.photos[0] ?? null;
  const isDraft = property.status === "RASCUNHO";
  const href = isDraft
    ? `/imoveis/${property.id}/editar?etapa=${Math.min(property.wizardStep + 1, 8)}`
    : `/imoveis/${property.id}`;
  const enabledPortals = property.publications.filter((p) => p.enabled);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-lg">
      <Link href={href} className="group block">
        <div className="relative aspect-[4/3] overflow-hidden bg-stone-200">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/arquivos/${cover.thumbPath}?v=${cover.updatedAt.getTime()}`}
              alt={displayTitle(property)}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-stone-400">
              <Camera className="size-10" />
              <span className="text-sm font-medium">Sem fotos</span>
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <Badge className={STATUS_BADGE_CLASSES[property.status]}>
              {STATUS_LABELS[property.status]}
            </Badge>
            {property.acceptsTrade && (
              <Badge className="bg-gold-100 text-gold-900">
                <Repeat className="size-4" /> Permuta
              </Badge>
            )}
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-gold-700">
          {property.refCode}
          {property.purpose && ` · ${PURPOSE_LABELS[property.purpose]}`}
          {property.propertyType &&
            ` · ${PROPERTY_TYPE_LABELS[property.propertyType]}`}
        </p>
        <Link href={href}>
          <h3 className="text-lg font-bold leading-snug text-stone-900 hover:text-brand-800">
            {displayTitle(property)}
          </h3>
        </Link>
        <p className="text-base text-stone-500">
          {property.neighborhood
            ? `${property.neighborhood}, ${property.city}`
            : property.city}
        </p>
        {property.broker && (
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500">
            <UserRound className="size-4" /> {property.broker.name}
          </p>
        )}
        {specsSummary(property) && (
          <p className="text-base text-stone-600">{specsSummary(property)}</p>
        )}
        <p className="mt-auto pt-2 font-display text-2xl font-bold text-brand-900">
          {priceLabel(property)}
        </p>
        {enabledPortals.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {enabledPortals.map((p) => (
              <span
                key={p.portal}
                className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600"
              >
                {PORTAL_LABELS[p.portal]}
              </span>
            ))}
          </div>
        )}
        {isDraft && (
          <div className="mt-2 flex flex-col gap-2">
            <Link
              href={href}
              className={buttonClasses("gold", "md") + " w-full"}
            >
              <Pencil className="size-5" /> Continuar cadastro
            </Link>
            <DeleteDraftButton
              propertyId={property.id}
              refCode={property.refCode}
              className="w-full justify-center"
            />
          </div>
        )}
      </div>
    </div>
  );
}
