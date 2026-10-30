// Cliente do Nominatim (geocodificação do OpenStreetMap, sem chave).
// Regras de uso do serviço: no máximo 1 consulta por segundo e um
// User-Agent que identifique o sistema. Por isso TODAS as consultas passam
// por uma fila única do servidor. Só roda no servidor.

const URL_BASE = "https://nominatim.openstreetmap.org/search";
const INTERVALO_MS = 1100;
const USER_AGENT = `FC-Imoveis/1.0 (+${process.env.APP_URL ?? "https://fcimoveis.duckdns.org"})`;

/** Falha de rede/serviço (não é "endereço não encontrado"): tentar depois. */
export class FalhaGeocodificacao extends Error {}

export type ResultadoOSM = {
  lat: number;
  lng: number;
  classe: string; // "highway", "place", "amenity"…
  tipo: string; // "residential", "suburb", "house"…
  nome: string;
  rua: string; // nome da rua do ponto (a própria rua, se o ponto é uma rua)
  numero: string | null; // número da casa, quando o OSM tem
  bairros: string; // bairro/vizinhança/condomínio que o OSM associa
  cidade: string;
};

let fila: Promise<unknown> = Promise.resolve();
let ultima = 0;
let pausadoAte = 0; // depois de um "muitas consultas", espera antes de insistir

function naFila<T>(tarefa: () => Promise<T>): Promise<T> {
  const vez = fila.then(async () => {
    const espera = ultima + INTERVALO_MS - Date.now();
    if (espera > 0) await new Promise((r) => setTimeout(r, espera));
    try {
      return await tarefa();
    } finally {
      ultima = Date.now();
    }
  });
  fila = vez.catch(() => undefined);
  return vez;
}

type Bruto = {
  lat: string;
  lon: string;
  category?: string;
  type?: string;
  name?: string;
  address?: Record<string, string>;
};

const CAMPOS_BAIRRO = [
  "residential",
  "neighbourhood",
  "quarter",
  "suburb",
  "city_district",
  "hamlet",
  "village",
];

/**
 * Plano B: Photon (outro buscador do OpenStreetMap, também sem chave) com
 * texto livre. Usado quando o Nominatim não responde ou pede pausa.
 */
export function buscarPhoton(
  texto: string,
  caixa?: { latMin: number; latMax: number; lngMin: number; lngMax: number },
): Promise<ResultadoOSM[]> {
  return naFila(async () => {
    const qs = new URLSearchParams({ q: texto, limit: "10" });
    if (caixa) {
      qs.set("bbox", [caixa.lngMin, caixa.latMin, caixa.lngMax, caixa.latMax].join(","));
    }
    let res: Response;
    try {
      res = await fetch(`https://photon.komoot.io/api/?${qs}`, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      });
    } catch {
      throw new FalhaGeocodificacao("Sem resposta do serviço de mapas.");
    }
    if (!res.ok) throw new FalhaGeocodificacao(`Serviço de mapas: ${res.status}`);
    const dados = (await res.json()) as {
      features?: {
        geometry: { coordinates: [number, number] };
        properties: Record<string, string | undefined>;
      }[];
    };
    return (dados.features ?? []).map((f) => {
      const p = f.properties;
      const [lng, lat] = f.geometry.coordinates;
      return {
        lat,
        lng,
        classe: p.osm_key ?? "",
        tipo: p.osm_value ?? "",
        nome: p.name ?? p.street ?? "",
        rua: p.street ?? (p.osm_key === "highway" ? (p.name ?? "") : ""),
        numero: p.housenumber ?? null,
        bairros: [p.locality, p.district].filter(Boolean).join(" | "),
        cidade: p.city ?? "",
      };
    });
  });
}

export function buscarNominatim(
  params: Record<string, string>,
): Promise<ResultadoOSM[]> {
  return naFila(async () => {
    if (Date.now() < pausadoAte) {
      throw new FalhaGeocodificacao("Serviço de mapas pediu uma pausa.");
    }
    const qs = new URLSearchParams({
      ...params,
      format: "jsonv2",
      addressdetails: "1",
      countrycodes: "br",
    });
    let res: Response;
    try {
      res = await fetch(`${URL_BASE}?${qs}`, {
        headers: { "User-Agent": USER_AGENT, "Accept-Language": "pt-BR" },
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      });
    } catch {
      throw new FalhaGeocodificacao("Sem resposta do serviço de mapas.");
    }
    if (res.status === 429 || res.status === 403) {
      pausadoAte = Date.now() + 10 * 60_000;
      throw new FalhaGeocodificacao("Serviço de mapas pediu uma pausa.");
    }
    if (!res.ok) throw new FalhaGeocodificacao(`Serviço de mapas: ${res.status}`);
    const dados = (await res.json()) as Bruto[];
    return dados.map((r) => {
      const a = r.address ?? {};
      return {
        lat: Number(r.lat),
        lng: Number(r.lon),
        classe: r.category ?? "",
        tipo: r.type ?? "",
        nome: r.name ?? a.road ?? "",
        rua: a.road ?? (r.category === "highway" ? (r.name ?? "") : ""),
        numero: a.house_number ?? null,
        bairros: CAMPOS_BAIRRO.map((k) => a[k])
          .filter(Boolean)
          .join(" | "),
        cidade: a.city ?? a.town ?? a.municipality ?? a.village ?? "",
      };
    });
  });
}
