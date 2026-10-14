// Links privados de imóvel (/exclusivo/[token]): um link por cliente, com
// senha criada pelo corretor na ficha. Guardamos apenas o HMAC da senha,
// amarrado ao id do link e ao segredo da instalação (DASHBOARD_SEGREDO) —
// mesmo esquema do acesso da equipe (lib/auth.ts): o banco nunca tem a senha,
// e trocar o segredo invalida todos os acessos.
import { hmacHex } from "./auth";

const FALLBACK_SECRET = "fc-imoveis-dev-sem-segredo";

export function linkSecret(): string {
  return process.env.DASHBOARD_SEGREDO || FALLBACK_SECRET;
}

/** HMAC da senha do link (o que fica salvo e o que vai no cookie do cliente),
 *  amarrado ao token do link — a mesma senha gera hashes diferentes por link.
 *  Maiúsculas/minúsculas e espaços nas pontas NÃO contam: "17DOGS" = "17dogs"
 *  (menos frustração para o cliente ao digitar). */
export async function hashLinkPassword(
  token: string,
  senha: string,
): Promise<string> {
  const normalizada = senha.trim().toLowerCase();
  return hmacHex(linkSecret(), `exclusivo\u0000${token}\u0000${normalizada}`);
}

/** Nome do cookie de acesso de UM link (tokens são base64url — válidos aqui). */
export function linkCookieName(token: string): string {
  return `fc_exclusivo_${token}`;
}

/** Token aleatório para a URL (16 bytes ≈ impossível de adivinhar). */
export function newLinkToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  // base64url, sem "=": só letras, números, "-" e "_"
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const LINK_RULES = {
  clientNameMin: 2,
  clientNameMax: 60,
  senhaMin: 4,
  senhaMax: 40,
} as const;
