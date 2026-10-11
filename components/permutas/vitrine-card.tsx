import Link from "next/link";
import { Bath, BedDouble, Camera, Car, Ruler } from "lucide-react";
import type { PublicProperty } from "@/lib/permutas/public-dto";
import { formatArea } from "@/lib/format";

/** Card público da vitrine de permutas (só cidade/bairro — nunca endereço). */
export function VitrineCard({ property }: { property: PublicProperty }) {
  const photo = property.photos[0];
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="relative aspect-[4/3] bg-stone-200">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.thumbUrl}
            alt={property.title}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-stone-400">
            <Camera className="size-10" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-gold-400 px-3 py-1 text-sm font-bold text-gold-950">
          ♻️ Permuta
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-gold-700">
          {property.typeLabel}
        </p>
        <h3 className="text-lg font-bold leading-snug text-stone-900">
          {property.title}
        </h3>
        <p className="text-base text-stone-500">📍 {property.location}</p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-base text-stone-600">
          {property.bedrooms ? (
            <span className="inline-flex items-center gap-1">
              <BedDouble className="size-4" /> {property.bedrooms}
            </span>
          ) : null}
          {property.bathrooms ? (
            <span className="inline-flex items-center gap-1">
              <Bath className="size-4" /> {property.bathrooms}
            </span>
          ) : null}
          {property.parking ? (
            <span className="inline-flex items-center gap-1">
              <Car className="size-4" /> {property.parking}
            </span>
          ) : null}
          {property.usableArea ?? property.totalArea ? (
            <span className="inline-flex items-center gap-1">
              <Ruler className="size-4" />
              {formatArea(property.usableArea ?? property.totalArea)}
            </span>
          ) : null}
        </div>
        <p className="mt-auto pt-2 font-display text-2xl font-bold text-brand-900">
          {property.valueLabel}
        </p>
        <Link
          href="/permutas/cadastrar"
          className="mt-2 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-700 px-4 font-semibold text-white hover:bg-brand-800"
        >
          🔑 Tenho interesse na troca
        </Link>
      </div>
    </div>
  );
}
