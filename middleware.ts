import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, expectedToken, safeEqual } from "@/lib/auth";
import { siteFechado } from "@/lib/site-fechado";

/**
 * Proteção por senha (DASHBOARD_SENHA).
 * - Sem a variável definida: tudo aberto (desenvolvimento local).
 * - O painel mora em /painel; a raiz "/" é o SITE público (com /imovel/[id]).
 * - Páginas/APIs da EQUIPE (EQUIPE abaixo) sempre pedem a senha.
 * - Com o site FECHADO (lib/site-fechado.ts), todo o resto também pede,
 *   menos SEMPRE_LIVRE: tela de entrar, feeds dos portais, fotos e links
 *   exclusivos de clientes. Com o site aberto, o resto é público.
 */
const EQUIPE = [
  "/painel",
  "/imoveis",
  "/configuracoes",
  "/permutas-admin",
  "/agenda",
  "/conversas",
  "/atividade",
  "/api/imoveis",
  "/api/corretores",
  "/api/configuracoes",
  "/api/permutas/admin",
  "/api/agenda/admin",
  "/api/chat/admin",
];

const SEMPRE_LIVRE = [
  "/entrar",
  "/api/entrar",
  "/api/sair",
  "/api/feeds",
  "/api/arquivos",
  "/exclusivo",
  "/api/exclusivo",
  "/api/atividade",
];

/** "/agenda" vale para /agenda e /agenda/..., mas não para /agendar. */
function comeca(pathname: string, lista: string[]): boolean {
  return lista.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function precisaSenha(pathname: string): boolean {
  if (comeca(pathname, EQUIPE)) return true;
  if (!siteFechado()) return false;
  return !comeca(pathname, SEMPRE_LIVRE);
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!precisaSenha(pathname)) return NextResponse.next();

  const expected = await expectedToken();
  if (!expected) return NextResponse.next();

  const cookie = request.cookies.get(ACCESS_COOKIE)?.value;
  if (safeEqual(cookie, expected)) return NextResponse.next();

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
  // Tudo, menos arquivos do próprio Next, ícones, logotipo e robots.txt
  // (a tela de entrar precisa deles antes da senha).
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|apple-icon\\.png|logo/|robots\\.txt).*)",
  ],
};
