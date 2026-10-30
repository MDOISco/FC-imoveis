import Link from "next/link";
import { Building2, CalendarDays, KeyRound, MessageCircle } from "lucide-react";
import { BuscaImoveis } from "@/components/site/busca-imoveis";
import { HeroVideo } from "@/components/site/hero-video";
import { ImovelCard, type SiteProperty } from "@/components/site/imovel-card";
import {
  SITE_BASE_WHERE,
  TIPOS_COMERCIAIS,
  buscaAtiva,
  filtrar,
  lerBusca,
  ordenar,
  paraItemBusca,
  paraQuery,
  resumoBusca,
} from "@/lib/busca-site";
import { db } from "@/lib/db";
import { publicLocation } from "@/lib/property-display";
import { getSettings } from "@/lib/settings";
import { waHref } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// Quantos cards a vitrine mostra de uma vez
const LIMITE_VITRINE = 60;

export default async function SiteHomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const busca = lerBusca(await searchParams);

  const [settings, publicados] = await Promise.all([
    getSettings(),
    db.property.findMany({
      where: SITE_BASE_WHERE,
      include: { photos: { orderBy: { position: "asc" } } },
      orderBy: { updatedAt: "desc" },
    }) as Promise<SiteProperty[]>,
  ]);

  // Mesma regra da contagem ao vivo da caixa de busca (lib/busca-site.ts)
  const itens = publicados.map(paraItemBusca);
  const porId = new Map(publicados.map((p) => [p.id, p]));
  const encontrados = ordenar(filtrar(itens, busca), busca);
  const properties = encontrados
    .slice(0, LIMITE_VITRINE)
    .map((i) => porId.get(i.id))
    .filter((p): p is SiteProperty => Boolean(p));
  const pesquisando = buscaAtiva(busca);
  const resumo = resumoBusca(busca);

  const zapGeral = waHref(
    settings.whatsapp,
    "Olá! Vim pelo site da FC Imóveis e gostaria de um atendimento.",
  );
  const zapSemResultado = waHref(
    settings.whatsapp,
    `Olá! Procurei no site da FC Imóveis (${resumo.join(" · ")}) e não encontrei. Podem me avisar quando tiver algo assim?`,
  );

  const stats = [
    { valor: itens.filter((i) => i.venda).length, label: "venda" },
    { valor: itens.filter((i) => i.aluguel).length, label: "aluguel" },
    { valor: itens.filter((i) => i.permuta).length, label: "permuta" },
    {
      valor: itens.filter((i) => i.tipo && TIPOS_COMERCIAIS.includes(i.tipo)).length,
      label: "comerciais",
    },
  ];

  return (
    <div>
      {/* ===== Hero (vídeo aéreo de Bragança em largura total) ===== */}
      <section className="relative overflow-hidden bg-brand-950 text-white">
        {/* Vídeo direto em HTML: o React não escreve o atributo "muted" no
            HTML do servidor, e sem ele o autoplay falha no celular. */}
        <div
          className="absolute inset-0"
          aria-hidden="true"
          dangerouslySetInnerHTML={{
            __html: `<video class="absolute inset-0 size-full object-cover" poster="/videos/braganca-aerea-poster.jpg" autoplay muted loop playsinline preload="auto"><source src="/videos/braganca-aerea.webm" type="video/webm"><source src="/videos/braganca-aerea.mp4" type="video/mp4"></video>`,
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-brand-950/90 via-brand-950/65 to-brand-950/90"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-14 text-center sm:px-6 sm:pt-20">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-gold-300">
            Imobiliária em Bragança Paulista · SP
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-bold leading-tight sm:text-6xl">
            Seu próximo endereço está em Bragança Paulista
          </h1>
          <div
            className="mx-auto mt-6 h-0.5 w-16 bg-gold-400"
            aria-hidden="true"
          />
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-100 sm:text-xl">
            Casas, apartamentos, chácaras e terrenos escolhidos a dedo, com o
            atendimento próximo de quem conhece cada rua da cidade.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#imoveis"
              className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-gold-400 px-8 text-lg font-extrabold text-gold-950 shadow-lg transition-colors hover:bg-gold-300"
            >
              <Building2 className="mr-2 size-6" /> Ver imóveis
            </a>
            <Link
              href="/agendar"
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border-2 border-gold-300/80 bg-white/10 px-8 text-lg font-bold text-white transition-colors hover:bg-white/20"
            >
              <CalendarDays className="mr-2 size-6" /> Agendar visita
            </Link>
            {zapGeral && (
              <a
                href={zapGeral}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl border-2 border-white/40 px-8 text-lg font-bold text-white transition-colors hover:border-gold-300 hover:text-gold-200"
              >
                <MessageCircle className="mr-2 size-6" /> Falar no WhatsApp
              </a>
            )}
          </div>
        </div>
        {/* Faixa de números */}
        <div className="relative border-t border-white/10">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-white/10 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-brand-950/70 px-4 py-5 text-center sm:px-6"
              >
                <span className="block font-display text-4xl font-bold leading-none text-gold-300">
                  {s.valor}
                </span>
                <span className="mt-2 block text-sm font-semibold text-brand-200 sm:text-base">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Busca (logo abaixo do banner) ===== */}
      <BuscaImoveis
        key={paraQuery(busca)}
        itens={itens}
        inicial={busca}
        whatsapp={settings.whatsapp}
      />

      {/* ===== Vitrine / resultado da busca ===== */}
      <section id="imoveis" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-gold-700">
          {pesquisando ? "Resultado da busca" : "Vitrine"}
        </p>
        <h2 className="mt-1 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
          {pesquisando
            ? `${encontrados.length} ${encontrados.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}`
            : "Imóveis em destaque"}
        </h2>
        {pesquisando && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {resumo.map((r) => (
              <span
                key={r}
                className="rounded-full bg-brand-100 px-3 py-1 text-base font-semibold text-brand-900"
              >
                {r}
              </span>
            ))}
            <Link
              href="/#busca"
              className="inline-flex min-h-10 items-center rounded-full px-3 text-base font-bold text-brand-700 underline hover:text-brand-900"
            >
              Limpar busca
            </Link>
            <a
              href="#busca"
              className="inline-flex min-h-10 items-center rounded-full px-3 text-base font-bold text-brand-700 underline hover:text-brand-900"
            >
              Mudar a busca
            </a>
          </div>
        )}
        <p className="mt-3 text-lg text-stone-600">
          Por segurança, mostramos apenas cidade e bairro — a localização exata
          é informada pela nossa equipe.
        </p>

        {properties.length === 0 ? (
          <p className="mt-8 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-100 p-10 text-center text-lg text-stone-600">
            {pesquisando
              ? "Nenhum imóvel com essa busca no momento."
              : "Nenhum imóvel publicado no momento."}
            {(pesquisando ? zapSemResultado : zapGeral) && (
              <>
                {" "}
                <a
                  href={(pesquisando ? zapSemResultado : zapGeral) ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-brand-700 underline"
                >
                  Fale com a gente
                </a>{" "}
                e avisamos quando chegar novidade.
              </>
            )}
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p, i) => (
              <div
                key={p.id}
                className="anim-entra grid"
                style={{ animationDelay: `${Math.min(i, 8) * 80}ms` }}
              >
                <ImovelCard
                  property={p}
                  whatsappHref={waHref(
                    settings.whatsapp,
                    `Olá! Tenho interesse no imóvel ${p.refCode} (${publicLocation(p)}) que vi no site da FC Imóveis.`,
                  )}
                />
              </div>
            ))}
          </div>
        )}
        {encontrados.length > properties.length && (
          <p className="mt-6 text-center text-lg text-stone-600">
            Mostrando {properties.length} de {encontrados.length}. Use a busca
            acima para afinar.
          </p>
        )}
      </section>

      {/* ===== Permutas (vídeo da chave dourada em largura total, sem som) ===== */}
      <section className="relative overflow-hidden bg-brand-950 text-white">
        {/* Autoplay robusto no celular (Modo de Economia, apps, etc.) */}
        <HeroVideo
          className="absolute inset-0 size-full object-cover"
          webm="/videos/chave-dourada.webm"
          mp4="/videos/chave-dourada.mp4"
          poster="/videos/chave-dourada-poster.jpg"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-brand-950/85 via-brand-950/55 to-brand-950/85"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-12 text-center sm:px-10 sm:py-16">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-gold-400 text-gold-950">
            <KeyRound className="size-9" />
          </span>
          <div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Quer trocar de imóvel?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-lg text-brand-100">
              Cadastre o seu imóvel na nossa página de permutas, veja as
              opções disponíveis e dê o match. Quando os dois lados combinam,
              <strong> a chave dourada se abre</strong> — e a gente cuida do
              resto.
            </p>
          </div>
          <Link
            href="/permutas"
            className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-gold-400 px-8 text-lg font-extrabold text-gold-950 shadow-lg transition-colors hover:bg-gold-300"
          >
            Conhecer as permutas
          </Link>
        </div>
      </section>
    </div>
  );
}
