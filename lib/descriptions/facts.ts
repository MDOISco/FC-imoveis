// Fatos TIPADOS do imóvel para gerar descrições. Regra de ouro: só entra aqui
// o que está cadastrado — nenhum gerador pode inventar fato que não exista.
// Dados internos (proprietário, comissão, notas) NUNCA entram.
import type { Property } from "@prisma/client";
import {
  AMENITY_BY_KEY,
  parseAmenities,
  PROPERTY_TYPE_LABELS,
  purposeIncludesRent,
  purposeIncludesSale,
  purposeIsSeason,
} from "@/lib/constants";

export type DescriptionFacts = {
  refCode: string;
  typeToken: string;
  typeLabel: string;
  purpose: string;
  forSale: boolean;
  forRent: boolean;
  forSeason: boolean;
  city: string;
  neighborhood: string | null; // null quando o endereço é oculto
  condoName: string | null;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parking: number | null;
  usableArea: number | null;
  totalArea: number | null;
  floor: number | null;
  yearBuilt: number | null;
  furnished: string | null; // NAO|SEMI|SIM
  acceptsPets: boolean;
  solarPosition: string | null;
  amenities: { lazer: string[]; seguranca: string[]; conforto: string[] };
  exclusive: boolean;
  acceptsFinancing: boolean;
  acceptsFgts: boolean;
  acceptsTrade: boolean;
  priceOnRequest: boolean;
  salePrice: number | null;
  rentPrice: number | null;
  seasonDailyPrice: number | null;
  condoFee: number | null;
  iptuValue: number | null;
  iptuPeriod: string;
  pricePerM2: number | null;
};

export function buildFacts(p: Property): DescriptionFacts {
  const keys = parseAmenities(p.amenities);
  const byCat = { lazer: [] as string[], seguranca: [] as string[], conforto: [] as string[] };
  for (const key of keys) {
    const a = AMENITY_BY_KEY[key];
    if (!a) continue;
    if (a.category === "LAZER") byCat.lazer.push(a.label);
    else if (a.category === "SEGURANCA") byCat.seguranca.push(a.label);
    else byCat.conforto.push(a.label);
  }

  const hideNeighborhood = p.addressVisibility === "OCULTO";
  const parking = (p.parkingCovered ?? 0) + (p.parkingUncovered ?? 0);
  const area = p.usableArea ?? p.totalArea;
  const pricePerM2 =
    p.salePrice && area && !p.priceOnRequest
      ? Math.round(p.salePrice / area)
      : null;

  return {
    refCode: p.refCode,
    typeToken: p.propertyType ?? "CASA",
    typeLabel: p.propertyType
      ? PROPERTY_TYPE_LABELS[p.propertyType]
      : "Imóvel",
    purpose: p.purpose ?? "VENDA",
    forSale: purposeIncludesSale(p.purpose),
    forRent: purposeIncludesRent(p.purpose),
    forSeason: purposeIsSeason(p.purpose),
    city: p.city,
    neighborhood: hideNeighborhood ? null : p.neighborhood,
    condoName: p.condoName,
    bedrooms: p.bedrooms,
    suites: p.suites,
    bathrooms: p.bathrooms,
    parking: parking > 0 ? parking : null,
    usableArea: p.usableArea,
    totalArea: p.totalArea,
    floor: p.floor,
    yearBuilt: p.yearBuilt,
    furnished: p.furnished,
    acceptsPets: p.acceptsPets,
    solarPosition: p.solarPosition,
    amenities: byCat,
    exclusive: p.exclusive,
    acceptsFinancing: p.acceptsFinancing,
    acceptsFgts: p.acceptsFgts,
    acceptsTrade: p.acceptsTrade,
    priceOnRequest: p.priceOnRequest,
    salePrice: p.priceOnRequest ? null : p.salePrice,
    rentPrice: p.priceOnRequest ? null : p.rentPrice,
    seasonDailyPrice: p.priceOnRequest ? null : p.seasonDailyPrice,
    condoFee: p.condoFee,
    iptuValue: p.iptuValue,
    iptuPeriod: p.iptuPeriod,
    pricePerM2,
  };
}
