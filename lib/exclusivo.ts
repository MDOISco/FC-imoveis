// Links privados de imóvel (/exclusivo/[token]): um link por cliente, com
// senha criada pelo corretor na ficha. Guardamos apenas o HMAC da senha,
// amarrado ao id do link e ao segredo da instalação (DASHBOARD_SEGREDO) —
// mesmo esquema do acesso da equipe (lib/auth.ts): o banco nunca tem a senha,
// e trocar o segredo invalida todos os acessos.
// Só para código de servidor (usa cookies e o banco).
import { cookies } from "next/headers";
import { hmacHex, safeEqual } from "./auth";
import { db } from "./db";

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

/** Este navegador já digitou a senha de algum link ATIVO deste imóvel?
 *  Libera, por exemplo, o agendamento de visita de um imóvel que está fora
 *  do site público mas foi apresentado ao cliente por link exclusivo. */
export async function temAcessoExclusivo(propertyId: string): Promise<boolean> {
  const links = await db.privateLink.findMany({
    where: { propertyId, active: true },
    select: { token: true, passwordHash: true },
  });
  if (links.length === 0) return false;
  const jar = await cookies();
  return links.some((l) =>
    safeEqual(jar.get(linkCookieName(l.token))?.value, l.passwordHash),
  );
}

/** Formato do link enviado ao painel — nunca inclui o hash da senha.
 *  Usado pela ficha do imóvel e pela API de links (um lugar só). */
export function linkToDto(
  link: {
    id: string;
    token: string;
    clientName: string;
    active: boolean;
    viewCount: number;
    lastViewAt: Date | null;
    createdAt: Date;
  },
  base: string,
) {
  return {
    id: link.id,
    clientName: link.clientName,
    active: link.active,
    viewCount: link.viewCount,
    lastViewAt: link.lastViewAt ? link.lastViewAt.toISOString() : null,
    createdAt: link.createdAt.toISOString(),
    url: `${base}/exclusivo/${link.token}`,
  };
}
