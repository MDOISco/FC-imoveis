import { NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sair do painel: apaga o cookie de acesso neste aparelho. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
