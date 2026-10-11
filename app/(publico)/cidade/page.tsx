import Link from "next/link";
import { MapaBraganca } from "@/components/cidade/mapa-braganca";
import { CURIOSIDADES_GERAIS } from "@/lib/cidade/pontos";

export const metadata = {
  title: "Conheça Bragança Paulista — FC Imóveis",
  description:
    "Mapa interativo com os pontos turísticos e as curiosidades da Cidade Poesia, a Capital Nacional da Linguiça Artesanal.",
};

export default function CidadePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:py-12">
      <section className="rounded-3xl bg-gradient-to-br from-brand-900 to-brand-700 px-6 py-10 text-center text-white sm:px-10">
        <p className="text-sm font-bold uppercase tracking-widest text-gold-300">
          FC Imóveis apresenta
        </p>
        <h1 className="mx-auto mt-2 max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
          Conheça Bragança Paulista, a Cidade Poesia 💚
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-brand-50">
          Navegue pelo mapa, toque nos pontos e descubra por que tanta gente
          escolhe viver aqui — a só uma hora de São Paulo, com clima de serra e
          vida boa de interior.
        </p>
      </section>

      <section>
        <h2 className="mb-1 text-2xl font-extrabold text-stone-900">
          🗺️ O mapa da cidade
        </h2>
        <p className="mb-5 text-base text-stone-500">
          Arraste, aproxime e toque nos pontos (ou na lista) para ver as
          curiosidades de cada lugar.
        </p>
        <MapaBraganca />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-extrabold text-stone-900">
          ✨ Curiosidades da nossa cidade
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CURIOSIDADES_GERAIS.map((c) => (
            <div
              key={c.titulo}
              className="rounded-2xl border-2 border-stone-200 bg-white p-5"
            >
              <p className="text-3xl">{c.emoji}</p>
              <h3 className="mt-2 text-lg font-bold text-stone-900">
                {c.titulo}
              </h3>
              <p className="mt-1 text-base text-stone-600">{c.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-gold-50 p-6 text-center sm:p-8">
        <h2 className="text-2xl font-extrabold text-stone-900">
          Quer morar nessa cidade boa? 🏡
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-lg text-stone-600">
          A FC Imóveis é daqui e conhece cada bairro. Fale com a Cátia e o
          Francisco!
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/site"
            className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-brand-700 px-8 text-lg font-extrabold text-white hover:bg-brand-800"
          >
            Ver imóveis
          </Link>
          <Link
            href="/permutas"
            className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-gold-400 px-8 text-lg font-extrabold text-gold-950 hover:bg-gold-300"
          >
            ♻️ Permutas
          </Link>
        </div>
      </section>
    </div>
  );
}
