// Cruzada de dados do deck: pontuação de mão dupla, simples e auditável.
// Quanto maior o score, mais cedo o imóvel aparece no deck do lead.
import type { Property, TradePreference } from "@prisma/client";

type WithPref = Property & { tradePreference: TradePreference | null };

function parseList(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Quanto o imóvel `candidate` atende à preferência `pref` de quem procura. */
function fitScore(pref: TradePreference | null, candidate: Property): number {
  if (!pref) return 0;
  let score = 0;
  const types = parseList(pref.types);
  const cities = parseList(pref.cities);
  const neighborhoods = parseList(pref.neighborhoods);

  if (types.length && candidate.propertyType && types.includes(candidate.propertyType)) {
    score += 3;
  }
  if (cities.length && cities.some((c) => c.toLowerCase() === candidate.city.toLowerCase())) {
    score += 2;
  }
  if (
    neighborhoods.length &&
    candidate.neighborhood &&
    neighborhoods.some(
      (n) => n.toLowerCase() === candidate.neighborhood!.toLowerCase(),
    )
  ) {
    score += 2;
  }
  if (pref.minBedrooms && (candidate.bedrooms ?? 0) >= pref.minBedrooms) {
    score += 1;
  }
  if (pref.minParking) {
    const parking =
      (candidate.parkingCovered ?? 0) + (candidate.parkingUncovered ?? 0);
    if (parking >= pref.minParking) score += 1;
  }
  if (
    pref.minUsableArea &&
    (candidate.usableArea ?? candidate.totalArea ?? 0) >= pref.minUsableArea
  ) {
    score += 1;
  }
  if (
    pref.maxValue &&
    candidate.salePrice &&
    !candidate.priceOnRequest &&
    candidate.salePrice <= pref.maxValue
  ) {
    score += 2;
  }
  return score;
}

/** Score de mão dupla: candidato atende o que EU procuro + meu imóvel atende o que ELE procura. */
export function twoWayScore(mine: WithPref, candidate: WithPref): number {
  return fitScore(mine.tradePreference, candidate) + fitScore(candidate.tradePreference, mine);
}
