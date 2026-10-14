import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-helpers";
import { ACCESS_COOKIE, expectedToken, safeEqual } from "@/lib/auth";
import {
  clientIp,
  isHttps,
  limparErros,
  minutosBloqueado,
  registrarErro,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Freio contra tentativas repetidas (lib/rate-limit, o mesmo do link
// exclusivo): a partir da 5ª senha errada, bloqueia por tempo que dobra.
const ERROS_LIVRES = 5;

/** Entrada da equipe: valida a senha única e grava o cookie de acesso. */
export async function POST(request: Request) {
  const senha = process.env.DASHBOARD_SENHA;
  if (!senha) {
    return NextResponse.json({ ok: true, aberto: true });
  }

  const key = `entrar:${clientIp(request)}`;
  const minutos = minutosBloqueado(key);
  if (minutos > 0) {
    return jsonError(
      `Muitas tentativas. Aguarde ${minutos} minuto(s) e tente de novo.`,
      429,
    );
  }

  const body = (await readJson(request)) as { senha?: unknown } | null;
  const tentativa = String(body?.senha ?? "");
  if (!tentativa) return jsonError("Digite a senha de acesso");

  if (!safeEqual(tentativa, senha)) {
    registrarErro(key, ERROS_LIVRES);
    await new Promise((r) => setTimeout(r, 800));
    return jsonError("Senha incorreta. Confira com a equipe.", 401);
  }

  limparErros(key);
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
