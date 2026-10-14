// Atividade do cliente na página do imóvel (apresentação exclusiva ou site):
// o que fica registrado, os nomes em pt-BR que o painel mostra e a busca da
// cidade aproximada pelo IP. Regras de privacidade: nunca guardamos o IP nem o
// navegador — só cidade/UF, tempo, rolagem e os cliques.

export const VISIT_ORIGINS = ["EXCLUSIVO", "SITE"] as const;
export type VisitOrigin = (typeof VISIT_ORIGINS)[number];

export const VISIT_EVENT_TYPES = [
  "WHATSAPP",
  "AGENDAR",
  "FOTO",
  "VIDEO",
  "SECAO",
] as const;
export type VisitEventType = (typeof VISIT_EVENT_TYPES)[number];

export function isVisitEventType(v: unknown): v is VisitEventType {
  return (
    typeof v === "string" &&
    (VISIT_EVENT_TYPES as readonly string[]).includes(v)
  );
}

export const VISIT_EVENT_LABELS: Record<VisitEventType, string> = {
  WHATSAPP: "Clicou em Falar no WhatsApp",
  AGENDAR: "Clicou em Agendar visita",
  FOTO: "Ampliou foto",
  VIDEO: "Deu play no vídeo",
  SECAO: "Viu a seção",
};

/** Limites para o banco não crescer sem controle com abusos. */
export const VISIT_LIMITS = {
  /** Recarregar a página em menos disso continua na MESMA visita. */
  reuseWindowMs: 30 * 60_000,
  /** Teto de tempo contado por visita (6 h): abas esquecidas abertas. */
  maxSeconds: 6 * 60 * 60,
  /** Teto de eventos por visita. */
  maxEvents: 300,
  /** Tamanho máximo do rótulo de um evento. */
  labelMax: 60,
  /** Visitas novas que um mesmo IP pode abrir por hora. */
  opensPerIpPerHour: 120,
} as const;

/** Tempo em texto curto para o painel: "45 s", "3 min", "1 h 12 min". */
export function formatDuracao(seconds: number): string {
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))} s`;
  const min = Math.floor(seconds / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const resto = min % 60;
  return resto ? `${h} h ${resto} min` : `${h} h`;
}

// ---------------------------------------------------------------------------
// Cidade aproximada pelo IP (serviço público, sem chave). Falhou ou demorou?
// Fica sem cidade — nunca atrasa nem derruba o registro da visita.
// ---------------------------------------------------------------------------

type Geo = { city: string | null; region: string | null };

const geoCache = new Map<string, { geo: Geo; at: number }>();
const GEO_CACHE_MS = 24 * 60 * 60_000;
const GEO_CACHE_MAX = 500;
const GEO_TIMEOUT_MS = 1_500;

/** IPs de rede local/teste não têm cidade (e não vale a pena consultar). */
function ipPrivado(ip: string): boolean {
  return (
    ip === "local" ||
    ip === "::1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    ip.startsWith("fc") ||
    ip.startsWith("fd") ||
    ip.startsWith("fe80")
  );
}

export async function cidadePorIp(ip: string): Promise<Geo> {
  const vazio: Geo = { city: null, region: null };
  if (!ip || ipPrivado(ip)) return vazio;

  const hit = geoCache.get(ip);
  if (hit && Date.now() - hit.at < GEO_CACHE_MS) return hit.geo;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,city,region_code`,
      { signal: controller.signal, cache: "no-store" },
    );
    if (!res.ok) return vazio;
    const data = (await res.json()) as {
      success?: boolean;
      city?: string;
      region_code?: string;
    };
    const geo: Geo = data.success
      ? {
          city: data.city?.slice(0, 80) || null,
          region: data.region_code?.slice(0, 10) || null,
        }
      : vazio;
    if (geoCache.size >= GEO_CACHE_MAX) {
      const primeira = geoCache.keys().next().value;
      if (primeira !== undefined) geoCache.delete(primeira);
    }
    geoCache.set(ip, { geo, at: Date.now() });
    return geo;
  } catch {
    return vazio;
  } finally {
    clearTimeout(timer);
  }
}
