import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-helpers";
import { ACCESS_COOKIE, tokenForPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Entrada da equipe: valida a senha única e grava o cookie de acesso. */
export async function POST(request: Request) {
  const senha = process.env.DASHBOARD_SENHA;
  if (!senha) {
    return NextResponse.json({ ok: true, aberto: true });
  }

  const body = (await readJson(request)) as { senha?: unknown } | null;
  const tentativa = String(body?.senha ?? "");
  if (!tentativa) return jsonError("Digite a senha de acesso");

  if (tentativa !== senha) {
    // Pequeno atraso para dificultar tentativas repetidas
    await new Promise((r) => setTimeout(r, 800));
    return jsonError("Senha incorreta. Confira com a equipe.", 401);
  }

  const token = await tokenForPassword(senha);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.url.startsWith("https"),
    maxAge: 60 * 60 * 24 * 60, // 60 dias
    path: "/",
  });
  return response;
}
