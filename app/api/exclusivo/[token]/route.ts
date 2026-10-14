import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-helpers";
import { safeEqual } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashLinkPassword, linkCookieName } from "@/lib/exclusivo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Freio contra chutes de senha (por IP+link, em memória — igual /api/entrar).
const attempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_FREE_ATTEMPTS = 5;
const BASE_LOCK_MS = 60_000;
const MAX_LOCK_MS = 60 * 60_000;

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (
    fwd?.split(",")[0] ??
    request.headers.get("x-real-ip") ??
    "local"
  ).trim();
}

function isHttps(request: Request): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    request.headers.get("x-forwarded-proto") === "https" ||
    request.url.startsWith("https")
  );
}

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

  const key = `${clientIp(request)}:${link.id}`;
  const now = Date.now();
  const state = attempts.get(key);
  if (state && state.lockedUntil > now) {
    const minutos = Math.ceil((state.lockedUntil - now) / 60_000);
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
    const count = (state?.count ?? 0) + 1;
    const over = Math.max(0, count - MAX_FREE_ATTEMPTS);
    const lockedUntil =
      over > 0 ? now + Math.min(BASE_LOCK_MS * 2 ** (over - 1), MAX_LOCK_MS) : 0;
    attempts.set(key, { count, lockedUntil });
    await new Promise((r) => setTimeout(r, 800));
    return jsonError("Senha incorreta. Confira a mensagem que você recebeu.", 401);
  }

  attempts.delete(key);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(linkCookieName(token), link.passwordHash, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps(request),
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    path: `/exclusivo/${token}`, // o cookie só vale para esta página
  });
  return response;
}
