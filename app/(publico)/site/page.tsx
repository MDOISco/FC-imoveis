import Link from "next/link";
import { Building2, Handshake, KeyRound, MessageCircle } from "lucide-react";
import { ImovelCard, type SiteProperty } from "@/components/site/imovel-card";
import { cn } from "@/lib/cn";
import { purposeIncludesRent, purposeIncludesSale } from "@/lib/constants";
import { db } from "@/lib/db";
import { publicLocation } from "@/lib/property-display";
import { getSettings } from "@/lib/settings";
import { waHref } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const DIFERENCIAIS = [
  {
    numero: "01",
    title: "Atendimento de verdade",
    text: "Aqui você fala direto com a Cátia ou com o Francisco — os corretores donos da FC — do primeiro contato até a entrega das chaves.",
  },
  {
    numero: "02",
    title: "Seu imóvel nos grandes portais",
    text: "Anunciamos com fotos tratadas e descrição caprichada nos principais portais de imóveis do Brasil.",
  },
  {
    numero: "03",
    title: "Permutas com a chave dourada",
    text: "Quer trocar de imóvel? Temos um sistema próprio de permutas: você cadastra o seu e, quando os dois lados combinam, a chave dourada se abre.",
  },
];

function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function SiteHomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const ver = first(params.ver);

  const [settings, todos] = await Promise.all([
    getSettings(),
    db.property.findMany({
      where: { status: "ATIVO", source: "CORRETOR" },
      include: { photos: { orderBy: { position: "asc" } } },
      orderBy: { updatedAt: "desc" },
      take: 60,
    }) as Promise<SiteProperty[]>,
  ]);

  const aVenda = todos.filter((p) => purposeIncludesSale(p.purpose));
  const paraAlugar = todos.filter((p) => purposeIncludesRent(p.purpose));
  const comPermuta = todos.filter((p) => p.acceptsTrade);

  const properties =
    ver === "comprar"
      ? aVenda
      : ver === "alugar"
        ? paraAlugar
        : ver === "permuta"
          ? comPermuta
          : todos;

  const filtros = [
    { valor: "", label: "Todos", total: todos.length },
    { valor: "comprar", label: "Comprar", total: aVenda.length },
    { valor: "alugar", label: "Alugar", total: paraAlugar.length },
    { valor: "permuta", label: "Com permuta", total: comPermuta.length },
  ];

  const zapGeral = waHref(
    settings.whatsapp,
    "Olá! Vim pelo site da FC Imóveis e gostaria de um atendimento.",
  );

  const stats = [
    { valor: aVenda.length, label: "imóveis à venda" },
    { valor: paraAlugar.length, label: "para alugar" },
    { valor: comPermuta.length, label: "aceitam permuta" },
  ];

  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 text-center sm:px-6 sm:pt-20">
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
        <div className="border-t border-white/10">
          <div className="mx-auto grid max-w-6xl grid-cols-3 gap-px bg-white/10">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-brand-950/60 px-4 py-5 text-center sm:px-6"
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

      {/* ===== Vitrine ===== */}
      <section id="imoveis" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-gold-700">
          Vitrine
        </p>
        <h2 className="mt-1 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
          Imóveis em destaque
        </h2>
        <p className="mt-2 text-lg text-stone-600">
          Por segurança, mostramos apenas cidade e bairro — a localização exata
          é informada pela nossa equipe.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {filtros.map((f) => {
            const ativo = ver === f.valor;
            return (
              <Link
                key={f.valor}
                href={f.valor ? `/site?ver=${f.valor}#imoveis` : "/site#imoveis"}
                aria-current={ativo ? "true" : undefined}
                className={cn(
                  "inline-flex min-h-12 items-center gap-2 rounded-xl border-2 px-4 font-semibold transition-colors",
                  ativo
                    ? "border-brand-800 bg-brand-800 text-white"
                    : "border-stone-200 bg-white text-stone-700 hover:border-brand-400",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-sm font-bold",
                    ativo
                      ? "bg-white/20 text-white"
                      : "bg-stone-100 text-stone-600",
                  )}
                >
                  {f.total}
                </span>
              </Link>
            );
          })}
        </div>

        {properties.length === 0 ? (
          <p className="mt-8 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-100 p-10 text-center text-lg text-stone-600">
            Nenhum imóvel nessa categoria no momento.
            {zapGeral && (
              <>
                {" "}
                <a
                  href={zapGeral}
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
            {properties.map((p) => (
              <ImovelCard
                key={p.id}
                property={p}
                whatsappHref={waHref(
                  settings.whatsapp,
                  `Olá! Tenho interesse no imóvel ${p.refCode} (${publicLocation(p)}) que vi no site da FC Imóveis.`,
                )}
              />
            ))}
          </div>
        )}
      </section>

      {/* ===== Por que a FC ===== */}
      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-gold-700">
            Por que a FC Imóveis
          </p>
          <h2 className="mt-1 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
            Uma imobiliária do tamanho certo
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {DIFERENCIAIS.map((d) => (
              <div
                key={d.numero}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-6"
              >
                <span className="font-display text-5xl font-bold leading-none text-gold-600">
                  {d.numero}
                </span>
                <h3 className="mt-4 text-xl font-bold text-stone-900">
                  {d.title}
                </h3>
                <p className="mt-1.5 text-base text-stone-600">{d.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 flex flex-wrap items-center gap-2 rounded-2xl bg-brand-100 p-5 text-lg text-brand-900">
            <Handshake className="size-6 shrink-0 text-brand-700" />
            <span>
              <strong>FC</strong> é de <strong>Francisco e Cátia</strong>: os
              dois corretores que atendem você pessoalmente, sem passar de mão
              em mão.
            </span>
          </p>
        </div>
      </section>

      {/* ===== Permutas (banner com vídeo aéreo de Bragança) ===== */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-brand-950 text-white shadow-lg">
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
            className="absolute inset-0 bg-gradient-to-b from-brand-950/85 via-brand-950/55 to-brand-950/85"
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-center gap-6 px-6 py-12 text-center sm:px-10 sm:py-16">
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
        </div>
      </section>
    </div>
  );
}
