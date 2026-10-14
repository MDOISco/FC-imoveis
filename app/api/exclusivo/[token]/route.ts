import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-helpers";
import { safeEqual } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashLinkPassword, linkCookieName } from "@/lib/exclusivo";
import {
  clientIp,
  isHttps,
  limparErros,
  minutosBloqueado,
  registrarErro,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Freio contra chutes de senha (lib/rate-limit, o mesmo de /api/entrar), em
// duas camadas: por IP+link (5 erros livres) e pelo link como um todo
// (30 erros livres) — assim trocar de IP não zera o contador do link.
const ERROS_LIVRES_IP = 5;
const ERROS_LIVRES_LINK = 30;

/** Cliente digita a senha do link exclusivo: valida e grava o cookie. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const link = await db.privateLink.findUnique({ where: { token } });
  if (!link || !link.active) {
    return jsonError(
      "Este link não está mais disponível. Fale com a FC Imóveis.",
      404,
    );
  }

  const keyIp = `exclusivo:${clientIp(request)}:${link.id}`;
  const keyLink = `exclusivo-link:${link.id}`;
  const minutos = Math.max(minutosBloqueado(keyIp), minutosBloqueado(keyLink));
  if (minutos > 0) {
    return jsonError(
      `Muitas tentativas. Aguarde ${minutos} minuto(s) e tente de novo.`,
      429,
    );
  }

  const body = (await readJson(request)) as { senha?: unknown } | null;
  const tentativa = String(body?.senha ?? "").trim();
  if (!tentativa) return jsonError("Digite a senha que você recebeu.");

  const hash = await hashLinkPassword(link.token, tentativa);
  if (!safeEqual(hash, link.passwordHash)) {
    registrarErro(keyIp, ERROS_LIVRES_IP);
    registrarErro(keyLink, ERROS_LIVRES_LINK);
    await new Promise((r) => setTimeout(r, 800));
    return jsonError("Senha incorreta. Confira a mensagem que você recebeu.", 401);
  }

  limparErros(keyIp);
  limparErros(keyLink);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(linkCookieName(token), link.passwordHash, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps(request),
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    // Vale no site inteiro (o nome já é exclusivo deste link): assim o
    // agendamento de visita reconhece o acesso mesmo fora do site público.
    path: "/",
  });
  return response;
}
