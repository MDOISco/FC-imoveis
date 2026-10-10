import Link from "next/link";
import { Handshake, KeyRound, Search } from "lucide-react";
import { AcessarPainel } from "@/components/permutas/acessar-painel";
import { VitrineCard } from "@/components/permutas/vitrine-card";
import { db } from "@/lib/db";
import { toPublicProperty } from "@/lib/permutas/public-dto";

export const dynamic = "force-dynamic";

const PASSOS = [
  {
    icon: Search,
    title: "1. Cadastre seu imóvel",
    text: "Leva poucos minutos: fotos, informações e o que você procura na troca.",
  },
  {
    icon: KeyRound,
    title: "2. Explore e dê o match",
    text: "Veja imóveis disponíveis para permuta. Gostou? Toque na chave. Se o outro lado também tiver interesse, a chave dourada se abre!",
  },
  {
    icon: Handshake,
    title: "3. A gente cuida do resto",
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
      <section className="rounded-3xl bg-gradient-to-br from-brand-900 to-brand-700 px-6 py-10 text-center text-white sm:px-10">
        <h1 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
          Troque seu imóvel pelo imóvel dos seus sonhos
          <span className="text-gold-300"> em Bragança Paulista</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-brand-50">
          A página de permutas da FC Imóveis funciona como um jogo de combinar:
          você cadastra o seu imóvel, curte os que interessam e, quando os dois
          lados combinam, <strong>a chave dourada se abre</strong>. 🔑
        </p>
        <Link
          href="/permutas/cadastrar"
          className="mt-7 inline-flex min-h-14 items-center justify-center rounded-2xl bg-gold-400 px-8 text-lg font-extrabold text-gold-950 shadow-lg hover:bg-gold-300"
        >
          Quero permutar meu imóvel
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PASSOS.map((p) => (
          <div
            key={p.title}
            className="rounded-2xl border border-stone-200 bg-white p-6 text-center"
          >
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <p.icon className="size-7" />
            </span>
            <h2 className="mt-3 text-lg font-bold text-stone-900">{p.title}</h2>
            <p className="mt-1.5 text-base text-stone-600">{p.text}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-xl font-bold text-stone-900">Já tenho cadastro</h2>
        <p className="mb-4 mt-1 text-base text-stone-600">
          Use o link privado que você recebeu ao cadastrar o seu imóvel.
        </p>
        <AcessarPainel />
      </section>

      <section>
        <h2 className="mb-1 text-2xl font-extrabold text-stone-900">
          Imóveis disponíveis para permuta
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
