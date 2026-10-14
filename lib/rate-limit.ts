// Freio contra chutes de senha, compartilhado por /api/entrar e
// /api/exclusivo/[token]: a partir de um número de erros, bloqueia por um
// tempo que dobra a cada novo erro. Fica na memória do processo (zera num
// restart — aceitável: o atacante também perde o progresso do chute).

type Estado = { count: number; lockedUntil: number; lastAt: number };

const BASE_LOCK_MS = 60_000;
const MAX_LOCK_MS = 60 * 60_000;
// Teto de entradas para a memória não crescer sem limite com IPs forjados.
const MAX_ENTRADAS = 5_000;

const tentativas = new Map<string, Estado>();

function limparAntigas(now: number) {
  if (tentativas.size < MAX_ENTRADAS) return;
  for (const [key, e] of tentativas) {
    // Sem bloqueio vigente e sem erro na última hora: pode esquecer.
    if (e.lockedUntil <= now && now - e.lastAt > 60 * 60_000) {
      tentativas.delete(key);
    }
  }
  // Ainda cheio (ataque em andamento): descarta as entradas mais antigas.
  while (tentativas.size >= MAX_ENTRADAS) {
    const primeira = tentativas.keys().next().value;
    if (primeira === undefined) break;
    tentativas.delete(primeira);
  }
}

/** Minutos restantes de bloqueio para esta chave (0 = liberado). */
export function minutosBloqueado(key: string): number {
  const estado = tentativas.get(key);
  const now = Date.now();
  if (!estado || estado.lockedUntil <= now) return 0;
  return Math.ceil((estado.lockedUntil - now) / 60_000);
}

/** Registra uma senha errada; depois de `livres` erros, começa a bloquear. */
export function registrarErro(key: string, livres: number): void {
  const now = Date.now();
  limparAntigas(now);
  const count = (tentativas.get(key)?.count ?? 0) + 1;
  const acima = Math.max(0, count - livres);
  const lockedUntil =
    acima > 0 ? now + Math.min(BASE_LOCK_MS * 2 ** (acima - 1), MAX_LOCK_MS) : 0;
  tentativas.set(key, { count, lockedUntil, lastAt: now });
}

/** Senha certa: limpa o histórico da chave. */
export function limparErros(key: string): void {
  tentativas.delete(key);
}

/** IP aproximado do visitante (atrás do Caddy vem no x-forwarded-for). */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (
    fwd?.split(",")[0] ??
    request.headers.get("x-real-ip") ??
    "local"
  ).trim();
}

/** A resposta pode marcar o cookie como "só HTTPS"? */
export function isHttps(request: Request): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    request.headers.get("x-forwarded-proto") === "https" ||
    request.url.startsWith("https")
  );
}
