import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, tokenForPassword } from "@/lib/auth";

/**
 * Proteção do dashboard por senha de equipe (DASHBOARD_SENHA).
 * - Sem a variável definida: tudo aberto (desenvolvimento local).
 * - Páginas/APIs PÚBLICAS (fora do matcher): /permutas*, /api/permutas (lead),
 *   /api/feeds (portais), /api/arquivos (fotos) e /entrar.
 */
export async function middleware(request: NextRequest) {
  const senha = process.env.DASHBOARD_SENHA;
  if (!senha) return NextResponse.next();

  const cookie = request.cookies.get(ACCESS_COOKIE)?.value;
  const expected = await tokenForPassword(senha);
  if (cookie === expected) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Acesso restrito à equipe. Entre pelo painel." },
      { status: 401 },
    );
  }
  const url = request.nextUrl.clone();
  url.pathname = "/entrar";
  url.search = `?de=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/",
    "/imoveis/:path*",
    "/configuracoes",
    "/permutas-admin",
    "/api/imoveis/:path*",
    "/api/corretores/:path*",
    "/api/configuracoes/:path*",
    "/api/permutas/admin/:path*",
  ],
};
