// Acesso da equipe por senha única (DASHBOARD_SENHA).
// Sem a variável definida, o sistema fica aberto (modo desenvolvimento local).
// O cookie guarda um HMAC da senha com um segredo por instalação
// (DASHBOARD_SEGREDO, gerado pelo instalador) — assim o cookie não permite
// descobrir a senha, e trocar o segredo invalida todas as sessões.
// Usa Web Crypto para funcionar tanto no middleware (edge) quanto no Node.

export const ACCESS_COOKIE = "fc_acesso";

const FALLBACK_SECRET = "fc-imoveis-dev-sem-segredo";

export function authEnabled(): boolean {
  return Boolean(process.env.DASHBOARD_SENHA);
}

let cached: { key: string; token: string } | null = null;

export async function expectedToken(): Promise<string | null> {
  const senha = process.env.DASHBOARD_SENHA;
  if (!senha) return null;
  const secret = process.env.DASHBOARD_SEGREDO || FALLBACK_SECRET;
  const key = `${secret}\u0000${senha}`;
  if (cached?.key === key) return cached.token;
  const token = await hmacHex(secret, senha);
  cached = { key, token };
  return token;
}

export async function hmacHex(
  secret: string,
  message: string,
): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Comparação em tempo constante (evita medir diferenças de tempo). */
export function safeEqual(a: string | undefined, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
