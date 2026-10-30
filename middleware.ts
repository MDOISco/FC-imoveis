import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, expectedToken, safeEqual } from "@/lib/auth";

/**
 * Proteção do painel da equipe (/painel e telas internas) por senha única
 * (DASHBOARD_SENHA). A raiz "/" leva ao site público (app/page.tsx).
 * - Sem a variável definida: tudo aberto (desenvolvimento local).
 * - Páginas/APIs PÚBLICAS (fora do matcher): /, /site*, /cidade, /agendar*,
 *   /exclusivo*, /permutas*, /api/permutas (lead),
 *   /api/feeds (portais), /api/arquivos (fotos), /entrar e /api/entrar.
 */
export async function middleware(request: NextRequest) {
  const expected = await expectedToken();
  if (!expected) return NextResponse.next();

  const cookie = request.cookies.get(ACCESS_COOKIE)?.value;
  if (safeEqual(cookie, expected)) return NextResponse.next();

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
    "/painel",
    "/imoveis/:path*",
    "/configuracoes",
    "/permutas-admin",
    "/agenda",
    "/conversas",
    "/atividade",
    "/api/imoveis/:path*",
    "/api/corretores/:path*",
    "/api/configuracoes/:path*",
    "/api/permutas/admin/:path*",
    "/api/agenda/admin/:path*",
    "/api/chat/admin/:path*",
  ],
};
