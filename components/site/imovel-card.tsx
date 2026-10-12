import Link from "next/link";
import { Bath, BedDouble, Camera, Car, MapPin, Ruler } from "lucide-react";
import type { Photo, Property } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { PROPERTY_TYPE_LABELS, PURPOSE_LABELS } from "@/lib/constants";
import { formatArea } from "@/lib/format";
import {
  priceLabel,
  publicLocation,
  totalParking,
} from "@/lib/property-display";

export type SiteProperty = Property & { photos: Photo[] };

/** Título público: nunca usa o bairro quando o endereço está oculto. */
function publicTitle(p: SiteProperty): string {
  if (p.title) return p.title;
  const type = p.propertyType ? PROPERTY_TYPE_LABELS[p.propertyType] : "Imóvel";
  if (p.addressVisibility === "OCULTO" || !p.neighborhood) return type;
  return `${type} — ${p.neighborhood}`;
}

/** Card da vitrine do site público (só cidade/bairro — nunca endereço). */
export function ImovelCard({
  property,
  whatsappHref,
}: {
  property: SiteProperty;
  whatsappHref: string | null;
}) {
  const cover =
    property.photos.find((f) => f.isCover) ?? property.photos[0] ?? null;
  const parking = totalParking(property);
  const area = property.usableArea ?? property.totalArea;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-lg">
      <div className="group relative aspect-[4/3] overflow-hidden bg-stone-200">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/arquivos/${cover.thumbPath}?v=${cover.updatedAt.getTime()}`}
            alt={publicTitle(property)}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-stone-400">
            <Camera className="size-10" />
            <span className="text-sm font-medium">Fotos em breve</span>
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {property.purpose && (
            <Badge className="bg-brand-900/90 text-white">
              {PURPOSE_LABELS[property.purpose]}
            </Badge>
          )}
          {property.acceptsTrade && (
            <Badge className="bg-gold-400 text-gold-950">🔑 Aceita permuta</Badge>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-gold-700">
          {property.refCode}
          {property.propertyType &&
            ` · ${PROPERTY_TYPE_LABELS[property.propertyType]}`}
        </p>
        <h3 className="text-xl font-bold leading-snug text-stone-900">
          {publicTitle(property)}
        </h3>
        <p className="inline-flex items-center gap-1.5 text-base text-stone-600">
          <MapPin className="size-4 shrink-0 text-brand-600" />
          {publicLocation(property)}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-base text-stone-600">
          {property.bedrooms ? (
            <span className="inline-flex items-center gap-1.5">
              <BedDouble className="size-5 text-stone-500" />
              {property.bedrooms}
            </span>
          ) : null}
          {property.bathrooms ? (
            <span className="inline-flex items-center gap-1.5">
              <Bath className="size-5 text-stone-500" /> {property.bathrooms}
            </span>
          ) : null}
          {parking > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Car className="size-5 text-stone-500" /> {parking}
            </span>
          )}
          {area ? (
            <span className="inline-flex items-center gap-1.5">
              <Ruler className="size-5 text-stone-500" /> {formatArea(area)}
            </span>
          ) : null}
        </div>
        <p className="mt-auto pt-3 font-display text-2xl font-bold text-brand-900">
          {priceLabel(property)}
        </p>
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 font-semibold text-white transition-colors hover:bg-brand-800"
          >
            Tenho interesse
          </a>
        )}
        {property.source === "CORRETOR" && (
          <Link
            href={`/agendar?imovel=${property.id}`}
            className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-brand-700 px-4 font-semibold text-brand-800 transition-colors hover:bg-brand-50"
          >
            📅 Agendar visita
          </Link>
        )}
      </div>
    </div>
  );
}
