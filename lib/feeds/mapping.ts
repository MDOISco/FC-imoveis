// Mapeamentos do nosso modelo para os tokens do feed VRSync (Canal Pro /
// Grupo OLX; aceito também por Chaves na Mão e Imovelweb). Qualquer correção
// de token fica concentrada NESTE arquivo.
import { AMENITY_BY_KEY } from "@/lib/constants";

/** Tipo do imóvel → <PropertyType> (formato "Uso / Tipo"). */
export const PROPERTY_TYPE_TO_VRSYNC: Record<string, string> = {
  CASA: "Residential / Home",
  CASA_CONDOMINIO: "Residential / Condo",
  SOBRADO: "Residential / Sobrado",
  APARTAMENTO: "Residential / Apartment",
  COBERTURA: "Residential / Penthouse",
  KITNET: "Residential / Kitnet",
  CHACARA: "Residential / Farm Ranch",
  SITIO: "Residential / Farm Ranch",
  FAZENDA: "Residential / Farm Ranch",
  TERRENO: "Residential / Land Lot",
  TERRENO_CONDOMINIO: "Residential / Land Lot",
  GALPAO: "Commercial / Industrial",
  SALA_COMERCIAL: "Commercial / Office",
  LOJA: "Commercial / Retail",
  PREDIO_COMERCIAL: "Commercial / Building",
  AREA_LOTE: "Commercial / Land Lot",
};

export function vrsyncPropertyType(token: string | null): string {
  return PROPERTY_TYPE_TO_VRSYNC[token ?? ""] ?? "Residential / Home";
}

/** Finalidade → <TransactionType>. */
export function vrsyncTransactionType(purpose: string | null): string {
  switch (purpose) {
    case "LOCACAO":
    case "TEMPORADA":
      return "For Rent";
    case "VENDA_LOCACAO":
      return "Sale/Rent";
    default:
      return "For Sale";
  }
}

/** Visibilidade do endereço → atributo displayAddress de <Location>. */
export function vrsyncDisplayAddress(visibility: string): string {
  return visibility === "COMPLETO" ? "All" : "Neighborhood";
}

/** Comodidades cadastradas → tokens <Feature> (sem token = fica fora). */
export function vrsyncFeatures(amenityKeys: string[]): string[] {
  const features: string[] = [];
  for (const key of amenityKeys) {
    const token = AMENITY_BY_KEY[key]?.vrsyncFeature;
    if (token) features.push(token);
  }
  return features;
}
