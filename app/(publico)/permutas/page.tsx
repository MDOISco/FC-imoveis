import Link from "next/link";
import { Handshake, KeyRound, Search } from "lucide-react";
import { AcessarPainel } from "@/components/permutas/acessar-painel";
import { VitrineCard } from "@/components/permutas/vitrine-card";
import { db } from "@/lib/db";
import { toPublicProperty } from "@/lib/permutas/public-dto";

export const dynamic = "force-dynamic";

const PASSOS = [
  {
    numero: "01",
    icon: Search,
    title: "Cadastre seu imóvel",
    text: "Leva poucos minutos: fotos, informações e o que você procura na troca.",
  },
  {
    numero: "02",
    icon: KeyRound,
    title: "Explore e dê o match",
    text: "Veja imóveis disponíveis para permuta. Gostou? Toque na chave. Se o outro lado também tiver interesse, a chave dourada se abre!",
  },
  {
    numero: "03",
    icon: Handshake,
    title: "A gente cuida do resto",
    text: "Deu match? Nossa equipe entra em contato com os dois lados e conduz a troca com segurança.",
  },
];

export default async function PermutasLandingPage() {
  const properties = await db.property.findMany({
    where: { status: "ATIVO", acceptsTrade: true },
    include: { photos: { orderBy: { position: "asc" } }, video: true },
    orderBy: { updatedAt: "desc" },
    take: 12,
  });

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-6 py-12 text-center text-white sm:px-10 sm:py-14">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-gold-300">
          FC Imóveis · Bragança Paulista
        </p>
        <h1 className="mx-auto mt-3 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-5xl">
          Troque seu imóvel pelo imóvel dos seus sonhos
        </h1>
        <div
          className="mx-auto mt-5 h-0.5 w-16 bg-gold-400"
          aria-hidden="true"
        />
        <p className="mx-auto mt-5 max-w-xl text-lg text-brand-100">
          A página de permutas da FC Imóveis funciona como um jogo de combinar:
          você cadastra o seu imóvel, curte os que interessam e, quando os dois
          lados combinam, <strong>a chave dourada se abre</strong>. 🔑
        </p>
        <Link
          href="/permutas/cadastrar"
          className="mt-8 inline-flex min-h-14 items-center justify-center rounded-2xl bg-gold-400 px-8 text-lg font-extrabold text-gold-950 shadow-lg hover:bg-gold-300"
        >
          Quero permutar meu imóvel
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PASSOS.map((p) => (
          <div
            key={p.title}
            className="rounded-2xl border border-stone-200 bg-white p-6"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-5xl font-bold leading-none text-gold-600">
                {p.numero}
              </span>
              <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <p.icon className="size-6" />
              </span>
            </div>
            <h2 className="mt-4 text-xl font-bold text-stone-900">{p.title}</h2>
            <p className="mt-1.5 text-base text-stone-600">{p.text}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border-2 border-brand-200 bg-brand-50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-950">
            Quer vender ou alugar seu imóvel?
          </h2>
          <p className="mt-1 max-w-xl text-base text-brand-900">
            A FC cuida de tudo: avaliação, fotos, anúncio nos portais e
            negociação. Cadastre aqui e nossa equipe entra em contato.
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:mt-0 sm:shrink-0 sm:items-center">
          <Link
            href="/permutas/cadastrar?objetivo=vender"
            className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-brand-700 px-7 text-lg font-extrabold text-white hover:bg-brand-800"
          >
            Quero vender meu imóvel
          </Link>
          <Link
            href="/permutas/cadastrar?objetivo=alugar"
            className="inline-flex min-h-12 items-center justify-center text-center text-base font-bold text-brand-800 underline hover:text-brand-950"
          >
            ou quero alugar meu imóvel
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="font-display text-2xl font-bold text-stone-900">
          Já tenho cadastro
        </h2>
        <p className="mb-4 mt-1 text-base text-stone-600">
          Use o link privado que você recebeu ao cadastrar o seu imóvel.
        </p>
        <AcessarPainel />
      </section>

      <section>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-gold-700">
          Vitrine de permutas
        </p>
        <h2 className="mb-1 mt-1 font-display text-3xl font-bold text-stone-900">
          Imóveis disponíveis para troca
        </h2>
        <p className="mb-5 text-base text-stone-500">
          Por segurança, mostramos apenas cidade e bairro. Cadastre-se para
          demonstrar interesse.
        </p>
        {properties.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-stone-300 bg-stone-100 p-10 text-center text-lg text-stone-500">
            Em breve novos imóveis por aqui. Seja o primeiro:{" "}
            <Link
              href="/permutas/cadastrar"
              className="font-bold text-brand-700 underline"
            >
              cadastre o seu!
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <VitrineCard key={p.id} property={toPublicProperty(p)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
