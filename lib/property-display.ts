// Helpers de exibição de imóvel compartilhados por dashboard, ficha e permutas.
import {
  PROPERTY_TYPE_LABELS,
  purposeIncludesRent,
  purposeIncludesSale,
  purposeIsSeason,
} from "./constants";
import { formatArea, formatBRL } from "./format";

type PropertyLike = {
  purpose?: string | null;
  propertyType?: string | null;
  title?: string | null;
  neighborhood?: string | null;
  city?: string;
  addressVisibility?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  suites?: number | null;
  parkingCovered?: number | null;
  parkingUncovered?: number | null;
  usableArea?: number | null;
  totalArea?: number | null;
  salePrice?: number | null;
  rentPrice?: number | null;
  seasonDailyPrice?: number | null;
  priceOnRequest?: boolean;
};

export function priceLabel(p: PropertyLike): string {
  if (p.priceOnRequest) return "Sob consulta";
  const parts: string[] = [];
  if (purposeIncludesSale(p.purpose) && p.salePrice) {
    parts.push(formatBRL(p.salePrice));
  }
  if (purposeIncludesRent(p.purpose) && p.rentPrice) {
    parts.push(`${formatBRL(p.rentPrice)}/mês`);
  }
  if (purposeIsSeason(p.purpose) && p.seasonDailyPrice) {
    parts.push(`${formatBRL(p.seasonDailyPrice)}/diária`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Valor a definir";
}

export function totalParking(p: PropertyLike): number {
  return (p.parkingCovered ?? 0) + (p.parkingUncovered ?? 0);
}

export function specsSummary(p: PropertyLike): string {
  const parts: string[] = [];
  if (p.bedrooms) {
    parts.push(`${p.bedrooms} quarto${p.bedrooms > 1 ? "s" : ""}`);
  }
  if (p.bathrooms) {
    parts.push(`${p.bathrooms} banheiro${p.bathrooms > 1 ? "s" : ""}`);
  }
  const parking = totalParking(p);
  if (parking > 0) parts.push(`${parking} vaga${parking > 1 ? "s" : ""}`);
  const area = p.usableArea ?? p.totalArea;
  if (area) parts.push(formatArea(area));
  return parts.join(" · ");
}

/** Localização segura para o PÚBLICO: nunca rua/número/CEP. */
export function publicLocation(p: PropertyLike): string {
  const city = p.city ?? "Bragança Paulista";
  if (p.addressVisibility === "OCULTO" || !p.neighborhood) return city;
  return `${p.neighborhood}, ${city}`;
}

export function displayTitle(p: PropertyLike): string {
  if (p.title) return p.title;
  const type = p.propertyType
    ? PROPERTY_TYPE_LABELS[p.propertyType]
    : "Imóvel";
  return p.neighborhood ? `${type} — ${p.neighborhood}` : type;
}

/** Título para o PÚBLICO: nunca usa o bairro quando o endereço está oculto. */
export function publicTitle(p: PropertyLike): string {
  if (p.title) return p.title;
  const type = p.propertyType
    ? PROPERTY_TYPE_LABELS[p.propertyType]
    : "Imóvel";
  if (p.addressVisibility === "OCULTO" || !p.neighborhood) return type;
  return `${type} — ${p.neighborhood}`;
}
