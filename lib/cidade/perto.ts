// "O que tem perto" de um imóvel. Funções puras (servidor e navegador): a
// página pública, a prévia da ficha, as descrições e a busca usam a MESMA
// regra.
//
// Privacidade (regra da casa): a coordenada do imóvel fica só no banco. Para
// fora sai apenas o nome do estabelecimento e uma FAIXA de distância
// ("até 500 m", "até 1 km"…), nunca a distância exata — com várias
// distâncias exatas daria para descobrir onde o imóvel fica.
import {
  CATEGORIAS_LUGAR,
  CATEGORIA_POR_VALOR,
  type CategoriaLugar,
} from "./categorias";
import { ESTABELECIMENTOS } from "./estabelecimentos";

/** Distância em linha reta (metros) entre dois pontos [lat, lng]. */
export function distanciaM(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Faixas públicas de distância (metros). A menor é 500 m de propósito. */
export const FAIXAS_M = [500, 1000, 2000, 3000, 5000] as const;

/** Índice da faixa (0 = até 500 m) ou null se passar de 5 km. */
export function faixaDe(metros: number): number | null {
  const i = FAIXAS_M.findIndex((f) => metros <= f);
  return i === -1 ? null : i;
}

export function rotuloFaixa(faixa: number): string {
  const m = FAIXAS_M[faixa] ?? FAIXAS_M[FAIXAS_M.length - 1];
  return m < 1000 ? `até ${m} m` : `até ${m / 1000} km`;
}

/** O que pode sair para o público sobre um lugar perto do imóvel. */
export type ItemPerto = {
  id: string; // id do estabelecimento
  categoria: CategoriaLugar;
  nome: string;
  tipo: string;
  faixa: number; // índice em FAIXAS_M
  rotulo: string; // "até 500 m"
};

/**
 * Os lugares mais próximos de um ponto: até `porCategoria` por categoria,
 * dentro do raio de cada categoria, do mais perto para o mais longe.
 */
export function lugaresPerto(
  ponto: { lat: number; lng: number },
  { porCategoria = 2, maximo = 12 }: { porCategoria?: number; maximo?: number } = {},
): ItemPerto[] {
  const ordem = new Map(CATEGORIAS_LUGAR.map((c, i) => [c.value, i]));
  const porCat = new Map<CategoriaLugar, { e: (typeof ESTABELECIMENTOS)[number]; d: number }[]>();
  for (const e of ESTABELECIMENTOS) {
    const d = distanciaM(ponto, e);
    if (d > CATEGORIA_POR_VALOR[e.categoria].raio) continue;
    const lista = porCat.get(e.categoria) ?? [];
    lista.push({ e, d });
    porCat.set(e.categoria, lista);
  }
  // rodadas[0] = o mais perto de cada categoria, rodadas[1] = o segundo…
  const rodadas: (ItemPerto & { d: number })[][] = [];
  for (const [categoria, lista] of porCat) {
    lista.sort((x, y) => x.d - y.d);
    lista.slice(0, porCategoria).forEach(({ e, d }, i) => {
      const faixa = faixaDe(d);
      if (faixa === null) return;
      (rodadas[i] ??= []).push({ id: e.id, categoria, nome: e.nome, tipo: e.tipo, faixa, rotulo: rotuloFaixa(faixa), d });
    });
  }
  const porPerto = (a: { faixa: number; categoria: CategoriaLugar; d: number }, b: typeof a) =>
    a.faixa - b.faixa ||
    (ordem.get(a.categoria) ?? 0) - (ordem.get(b.categoria) ?? 0) ||
    a.d - b.d;
  // Variedade primeiro: só entra o 2º de uma categoria se sobrar espaço
  return rodadas
    .flatMap((r) => r.sort(porPerto))
    .slice(0, maximo)
    .sort(porPerto)
    .map(({ d: _d, ...item }) => item);
}

/** Faixa do lugar mais próximo de cada categoria (até 5 km) — para a busca. */
export function faixaPorCategoria(ponto: {
  lat: number;
  lng: number;
}): Partial<Record<CategoriaLugar, number>> {
  const menor: Partial<Record<CategoriaLugar, number>> = {};
  for (const e of ESTABELECIMENTOS) {
    const d = distanciaM(ponto, e);
    if (menor[e.categoria] === undefined || d < (menor[e.categoria] as number)) {
      menor[e.categoria] = d;
    }
  }
  const faixas: Partial<Record<CategoriaLugar, number>> = {};
  for (const [cat, d] of Object.entries(menor) as [CategoriaLugar, number][]) {
    const f = faixaDe(d);
    if (f !== null) faixas[cat] = f;
  }
  return faixas;
}

/** Praça Raul Leme (Catedral): o "centro" da cidade para as distâncias. */
export const PONTO_CENTRO = { lat: -22.9564684, lng: -46.5419527 };

/** Faixas (km) da distância até o Centro — largas de propósito. */
export const FAIXAS_CENTRO_KM = [1, 2, 3, 5, 10, 15, 20, 30] as const;

/** "até 10 km do Centro" (null se muito longe ou já no Centro). */
export function rotuloCentro(ponto: { lat: number; lng: number }): string | null {
  const km = distanciaM(ponto, PONTO_CENTRO) / 1000;
  const f = FAIXAS_CENTRO_KM.find((k) => km <= k);
  if (f === undefined) return null;
  return f === 1 ? "no Centro ou pertinho dele (até 1 km)" : `até ${f} km do Centro`;
}

/* ======================= Regras do imóvel ======================= */

/**
 * Precisões boas o bastante para mostrar "o que tem perto" ao público.
 * BAIRRO (centro do bairro) fica de fora: pode errar por mais de 1 km — a
 * equipe confirma o ponto na ficha e aí ele vira MANUAL.
 */
export const PRECISOES_PUBLICAS = ["MANUAL", "ENDERECO", "RUA", "CONDOMINIO"];

export type ImovelGeo = {
  latitude: number | null;
  longitude: number | null;
  geoPrecision: string | null;
  addressVisibility: string;
};

/** Ponto do imóvel, SÓ para uso interno nos cálculos (nunca enviar ao público). */
export function pontoDoImovel(p: ImovelGeo): { lat: number; lng: number } | null {
  if (p.addressVisibility === "OCULTO") return null; // nem o bairro é público
  if (p.latitude === null || p.longitude === null) return null;
  if (!p.geoPrecision || !PRECISOES_PUBLICAS.includes(p.geoPrecision)) return null;
  return { lat: p.latitude, lng: p.longitude };
}

/** Lista pública do que tem perto (vazia quando não pode ou não sabe). */
export function pertoDoImovel(
  p: ImovelGeo,
  opcoes?: { porCategoria?: number; maximo?: number },
): ItemPerto[] {
  const ponto = pontoDoImovel(p);
  return ponto ? lugaresPerto(ponto, opcoes) : [];
}

/** Distância do imóvel até o Centro, em faixa (null quando não pode/sabe). */
export function centroDoImovel(p: ImovelGeo): string | null {
  const ponto = pontoDoImovel(p);
  return ponto ? rotuloCentro(ponto) : null;
}
