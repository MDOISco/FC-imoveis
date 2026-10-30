import Link from "next/link";
import { CATEGORIAS_LUGAR } from "@/lib/cidade/categorias";
import type { ItemPerto } from "@/lib/cidade/perto";

/**
 * Seção pública "O que tem perto" da página do imóvel (site e link
 * exclusivo). Componente de SERVIDOR: recebe só a lista pronta (nomes e
 * FAIXAS de distância) — a coordenada do imóvel nunca chega aqui.
 */
export function PertoDoImovel({
  itens,
  centro,
  linkMapa = false,
}: {
  itens: ItemPerto[];
  centro: string | null; // "até 10 km do Centro" (centroDoImovel)
  linkMapa?: boolean; // link para o mapa da cidade (o link exclusivo não tem)
}) {
  if (itens.length === 0 && !centro) return null;

  // Agrupa na ordem das categorias (a lista já vem do mais perto ao mais longe)
  const grupos = CATEGORIAS_LUGAR.map((cat) => ({
    cat,
    lugares: itens.filter((i) => i.categoria === cat.value),
  })).filter((g) => g.lugares.length > 0);

  return (
    <section
      data-secao="O que tem perto"
      className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8"
    >
      <h2 className="font-display text-2xl font-bold text-stone-900">
        O que tem perto
      </h2>
      <div className="mb-1 mt-2 h-0.5 w-12 bg-gold-400" aria-hidden="true" />

      {centro && (
        <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-lg font-semibold text-brand-900">
          <span aria-hidden="true">📍 </span>Fica {centro}
        </p>
      )}

      {grupos.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          {grupos.map(({ cat, lugares }) => (
            <div key={cat.value}>
              <p className="flex items-center gap-2 text-lg font-bold text-stone-900">
                <span className="text-2xl leading-none" aria-hidden="true">
                  {cat.emoji}
                </span>
                {cat.label}
              </p>
              <ul className="mt-2 space-y-2">
                {lugares.map((l) => (
                  <li
                    key={l.id}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
                  >
                    <span className="text-lg text-stone-700">{l.nome}</span>
                    <span className="shrink-0 rounded-full bg-brand-50 px-3 py-0.5 text-base font-bold text-brand-900">
                      {l.rotulo}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-base text-stone-500">
        Distâncias aproximadas, em linha reta. Por segurança, mostramos só
        faixas de distância — a Cátia ou o Francisco passam a localização
        exata no atendimento. A lista traz alguns lugares de referência, não
        todos.
      </p>

      {linkMapa && (
        <Link
          href="/cidade#estabelecimentos"
          className="mt-3 inline-flex min-h-12 items-center gap-2 text-lg font-semibold text-brand-800 underline-offset-4 hover:text-brand-950 hover:underline"
        >
          <span aria-hidden="true">🗺️</span> Ver o mapa da cidade
        </Link>
      )}
    </section>
  );
}
