import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-helpers";
import { ACCESS_COOKIE, expectedToken, safeEqual } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Freio contra tentativas repetidas (por IP, em memória do processo):
// a partir da 5ª senha errada, bloqueia por um tempo que dobra a cada erro.
const attempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_FREE_ATTEMPTS = 5;
const BASE_LOCK_MS = 60_000;
const MAX_LOCK_MS = 60 * 60_000;

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "local").trim();
}

function isHttps(request: Request): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    request.headers.get("x-forwarded-proto") === "https" ||
    request.url.startsWith("https")
  );
}

/** Entrada da equipe: valida a senha única e grava o cookie de acesso. */
export async function POST(request: Request) {
  const senha = process.env.DASHBOARD_SENHA;
  if (!senha) {
    return NextResponse.json({ ok: true, aberto: true });
  }

  const ip = clientIp(request);
  const now = Date.now();
  const state = attempts.get(ip);
  if (state && state.lockedUntil > now) {
    const minutos = Math.ceil((state.lockedUntil - now) / 60_000);
    return jsonError(
      `Muitas tentativas. Aguarde ${minutos} minuto(s) e tente de novo.`,
      429,
    );
  }

  const body = (await readJson(request)) as { senha?: unknown } | null;
  const tentativa = String(body?.senha ?? "");
  if (!tentativa) return jsonError("Digite a senha de acesso");

  if (!safeEqual(tentativa, senha)) {
    const count = (state?.count ?? 0) + 1;
    const over = Math.max(0, count - MAX_FREE_ATTEMPTS);
    const lockedUntil =
      over > 0
        ? now + Math.min(BASE_LOCK_MS * 2 ** (over - 1), MAX_LOCK_MS)
        : 0;
    attempts.set(ip, { count, lockedUntil });
    await new Promise((r) => setTimeout(r, 800));
    return jsonError("Senha incorreta. Confira com a equipe.", 401);
  }

  attempts.delete(ip);
  const token = (await expectedToken())!;
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps(request),
    maxAge: 60 * 60 * 24 * 60, // 60 dias
    path: "/",
  });
  return response;
}
