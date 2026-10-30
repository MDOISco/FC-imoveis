import { cookies } from "next/headers";
import { Lock, MessageCircle, Sparkles } from "lucide-react";
import { ImovelDetalhes } from "@/components/site/imovel-detalhes";
import { RastreioAtividade } from "@/components/site/rastreio-atividade";
import { SenhaExclusiva } from "@/components/site/senha-exclusiva";
import { Logo } from "@/components/ui/logo";
import { ACCESS_COOKIE, expectedToken, safeEqual } from "@/lib/auth";
import { db } from "@/lib/db";
import { linkCookieName } from "@/lib/exclusivo";
import { publicLocation } from "@/lib/property-display";
import { getSettings } from "@/lib/settings";
import { waHref } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// Página privada de UM cliente: nunca deve aparecer em buscadores.
export const metadata = {
  robots: { index: false, follow: false },
};

type Params = { params: Promise<{ token: string }> };

function Cabecalho({ agencyName }: { agencyName: string }) {
  return (
    <header className="border-b-2 border-gold-500 bg-brand-950 text-white">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Logo selo className="h-14" />
        <span>
          <span className="block font-display text-xl font-bold tracking-tight sm:text-2xl">
            {agencyName}
          </span>
          <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">
            Apresentação exclusiva
          </span>
        </span>
      </div>
    </header>
  );
}

function Rodape({
  agencyName,
  creci,
  phone,
  whatsapp,
}: {
  agencyName: string;
  creci: string | null;
  phone: string | null;
  whatsapp: string | null;
}) {
  const contato =
    [creci && `CRECI ${creci}`, phone, whatsapp && `WhatsApp ${whatsapp}`]
      .filter(Boolean)
      .join(" · ") || "Bragança Paulista/SP";
  return (
    <footer className="mt-10 border-t-2 border-gold-500 bg-brand-950 py-8 text-center text-brand-100">
      <p className="font-display text-xl font-bold text-white">{agencyName}</p>
      <p className="mt-2 px-4 text-base">{contato}</p>
    </footer>
  );
}

/**
 * Link privado enviado a UM cliente: mostra só este imóvel, atrás de senha.
 * Sem menu nem links para o resto do site — é quase uma landing page.
 */
export default async function ExclusivoPage({ params }: Params) {
  const { token } = await params;
  const [link, settings] = await Promise.all([
    db.privateLink.findUnique({
      where: { token },
      include: {
        property: {
          include: {
            photos: { orderBy: { position: "asc" } },
            video: true,
          },
        },
      },
    }),
    getSettings(),
  ]);

  const zapGeral = waHref(
    settings.whatsapp,
    "Olá! Recebi um link exclusivo da FC Imóveis que não está mais abrindo.",
  );

  // Link inexistente ou desativado pela equipe
  if (!link || !link.active) {
    return (
      <div className="flex min-h-screen flex-col">
        <Cabecalho agencyName={settings.agencyName} />
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-stone-200 text-stone-500">
            <Lock className="size-8" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold text-stone-900">
            Este link não está mais disponível
          </h1>
          <p className="mt-3 text-lg text-stone-600">
            Ele pode ter sido desativado pela nossa equipe. Fale com a gente
            para receber um link novo.
          </p>
          {zapGeral && (
            <a
              href={zapGeral}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-brand-700 px-8 text-lg font-bold text-white hover:bg-brand-800"
            >
              <MessageCircle className="size-6" /> Falar no WhatsApp
            </a>
          )}
        </main>
        <Rodape
          agencyName={settings.agencyName}
          creci={settings.creci}
          phone={settings.phone}
          whatsapp={settings.whatsapp}
        />
      </div>
    );
  }

  // Senha ainda não informada neste navegador → tela de senha
  const cookieStore = await cookies();
  const cookie = cookieStore.get(linkCookieName(token))?.value;
  const autorizado = safeEqual(cookie, link.passwordHash);

  if (!autorizado) {
    return (
      <div className="flex min-h-screen flex-col">
        <Cabecalho agencyName={settings.agencyName} />
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16">
          <div className="rounded-3xl border-2 border-gold-300 bg-white p-8 shadow-lg">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-gold-400 text-gold-950">
              <Sparkles className="size-7" />
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold text-stone-900">
              Olá, {link.clientName}!
            </h1>
            <p className="mt-2 text-lg text-stone-600">
              A {settings.agencyName} separou um imóvel especialmente para
              você. Digite a senha que recebeu da nossa equipe para ver tudo.
            </p>
            <div className="mt-6">
              <SenhaExclusiva token={token} />
            </div>
          </div>
        </main>
        <Rodape
          agencyName={settings.agencyName}
          creci={settings.creci}
          phone={settings.phone}
          whatsapp={settings.whatsapp}
        />
      </div>
    );
  }

  // Visita autorizada: registra a atividade (base do acompanhamento em
  // tempo real que entra na próxima etapa do projeto). Para o número fazer
  // sentido, não conta a própria equipe conferindo o link, nem recarregamentos
  // da página em menos de 30 minutos.
  const tokenEquipe = await expectedToken();
  const ehEquipe = tokenEquipe
    ? safeEqual(cookieStore.get(ACCESS_COOKIE)?.value, tokenEquipe)
    : false;
  const MEIA_HORA_MS = 30 * 60_000;
  const visitaNova =
    !link.lastViewAt || Date.now() - link.lastViewAt.getTime() > MEIA_HORA_MS;
  if (!ehEquipe && visitaNova) {
    await db.privateLink.update({
      where: { id: link.id },
      data: { viewCount: { increment: 1 }, lastViewAt: new Date() },
    });
  }

  const property = link.property;

  return (
    <div className="flex min-h-screen flex-col">
      <Cabecalho agencyName={settings.agencyName} />
      <div className="border-b border-gold-200 bg-gold-50">
        <p className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 text-base font-semibold text-gold-900 sm:px-6">
          <Sparkles className="size-5 shrink-0 text-gold-600" />
          Apresentação preparada especialmente para você, {link.clientName}.
        </p>
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <ImovelDetalhes
          property={property}
          whatsapp={settings.whatsapp}
          whatsappText={`Olá! Sou ${link.clientName}. Vi a apresentação exclusiva do imóvel ${property.refCode} (${publicLocation(property)}) e gostaria de conversar.`}
        />
        <p className="mt-8 text-center text-sm text-stone-500">
          Para a equipe atender você melhor, registramos quando esta
          apresentação é aberta, o que é clicado e a cidade aproximada do
          acesso. Nada disso é compartilhado com terceiros.
        </p>
      </main>
      {/* Registro silencioso da visita (só depois da senha; não conta a equipe). */}
      <RastreioAtividade origem="EXCLUSIVO" token={token} />
      <Rodape
        agencyName={settings.agencyName}
        creci={settings.creci}
        phone={settings.phone}
        whatsapp={settings.whatsapp}
      />
    </div>
  );
}
