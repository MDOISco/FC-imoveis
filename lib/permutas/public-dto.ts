// Serializador PÚBLICO de imóvel (vitrine, deck, matches do lead).
// REGRA DE PRIVACIDADE: nunca expõe rua, número, CEP, complemento, dados do
// proprietário/lead nem valores internos — apenas cidade/bairro e specs.
import type { Photo, Property, Video } from "@prisma/client";
import {
  parseAmenities,
  AMENITY_BY_KEY,
  PROPERTY_TYPE_LABELS,
} from "@/lib/constants";
import { formatBRL } from "@/lib/format";

export type PublicPhoto = {
  thumbUrl: string;
  webUrl: string;
  caption: string | null;
};

export type PublicProperty = {
  id: string;
  refCode: string;
  typeLabel: string;
  title: string;
  location: string; // "Bairro, Cidade" ou só "Cidade"
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  usableArea: number | null;
  totalArea: number | null;
  valueLabel: string; // "R$ 450.000" ou "Valor a combinar"
  description: string | null;
  amenities: string[];
  sourceLabel: string; // "Imóvel da FC Imóveis" | "Imóvel de cliente"
  photos: PublicPhoto[];
  videoUrl: string | null;
};

export function toPublicProperty(
  p: Property & { photos: Photo[]; video?: Video | null },
): PublicProperty {
  const hideNeighborhood = p.addressVisibility === "OCULTO";
  const ordered = [...p.photos].sort(
    (a, b) => Number(b.isCover) - Number(a.isCover) || a.position - b.position,
  );
  const typeLabel = p.propertyType
    ? PROPERTY_TYPE_LABELS[p.propertyType]
    : "Imóvel";
  const value =
    !p.priceOnRequest && p.salePrice ? formatBRL(p.salePrice) : null;

  return {
    id: p.id,
    refCode: p.refCode,
    typeLabel,
    title:
      p.title ??
      `${typeLabel}${!hideNeighborhood && p.neighborhood ? ` — ${p.neighborhood}` : ""}`,
    location:
      !hideNeighborhood && p.neighborhood
        ? `${p.neighborhood}, ${p.city}`
        : p.city,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    parking:
      (p.parkingCovered ?? 0) + (p.parkingUncovered ?? 0) > 0
        ? (p.parkingCovered ?? 0) + (p.parkingUncovered ?? 0)
        : null,
    usableArea: p.usableArea,
    totalArea: p.totalArea,
    valueLabel: value ?? "Valor a combinar",
    description: p.description ?? p.leadDescription,
    amenities: parseAmenities(p.amenities)
      .map((k) => AMENITY_BY_KEY[k]?.label)
      .filter((x): x is string => Boolean(x)),
    sourceLabel:
      p.source === "CORRETOR" ? "Imóvel da FC Imóveis" : "Imóvel de cliente",
    photos: ordered.map((f) => ({
      thumbUrl: `/api/arquivos/${f.thumbPath}?v=${f.updatedAt.getTime()}`,
      webUrl: `/api/arquivos/${f.webPath}?v=${f.updatedAt.getTime()}`,
      caption: f.caption,
    })),
    videoUrl: p.video ? `/api/arquivos/${p.video.path}` : null,
  };
}
