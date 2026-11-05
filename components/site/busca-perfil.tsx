"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Baby,
  Car,
  Check,
  Heart,
  Laptop,
  PawPrint,
  RotateCcw,
  Search,
  Wand2,
} from "lucide-react";
import { MapaEstabelecimentos } from "@/components/cidade/mapa-estabelecimentos";
import { Spinner } from "@/components/ui/spinner";
import {
  OPCOES_MORADORES,
  PERFIL_VAZIO,
  lerTexto,
  perfilParaBusca,
  perfilPreenchido,
  quartosSugeridos,
  resumoPerfil,
  type Perfil,
} from "@/lib/busca-perfil";
import { combina, paraQuery, resumoBusca, type ItemBusca } from "@/lib/busca-site";
import { cn } from "@/lib/cn";

/**
 * Busca personalizada do site: o cliente conta COMO MORA (checklist ou texto
 * livre) e a gente traduz para os filtros da busca comum — quartos pela
 * quantidade de pessoas, vagas pelos carros, aceita pet etc. (lib/busca-perfil).
 * O botão leva para a mesma URL da busca convencional, que segue valendo.
 */
export function BuscaPerfil({ itens }: { itens: ItemBusca[] }) {
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil>(PERFIL_VAZIO);
  const [texto, setTexto] = useState("");
  const [buscando, startTransition] = useTransition();

  const busca = useMemo(() => perfilParaBusca(perfil), [perfil]);
  const total = useMemo(
    () => itens.reduce((n, i) => n + (combina(i, busca) ? 1 : 0), 0),
    [itens, busca],
  );
  const preenchido = perfilPreenchido(perfil);
  const entendido = resumoPerfil(perfil);
  const filtros = resumoBusca(busca);

  const muda = (parcial: Partial<Perfil>) => setPerfil((p) => ({ ...p, ...parcial }));

  // Conta quantos imóveis sobram se uma opção for escolhida (número ao vivo)
  const conta = (parcial: Partial<Perfil>) => {
    const b = perfilParaBusca({ ...perfil, ...parcial });
    return itens.reduce((n, i) => n + (combina(i, b) ? 1 : 0), 0);
  };

  // O texto livre preenche o checklist na hora (as opções acendem sozinhas)
  const aoEscrever = (v: string) => {
    setTexto(v);
    const entendidos = lerTexto(v);
    if (Object.keys(entendidos).length) setPerfil((p) => ({ ...p, ...entendidos }));
  };

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!preenchido) return;
    const q = paraQuery(busca);
    startTransition(() => router.push(`/${q ? `?${q}` : ""}#imoveis`));
  }

  return (
    <section
      id="busca-perfil"
      aria-label="Busca personalizada"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-8 sm:px-6"
    >
      <form
        onSubmit={buscar}
        className="anim-entra sombra-branca relative overflow-hidden rounded-3xl bg-white"
      >
        <div className="busca-faixa h-1.5" aria-hidden="true" />
        <div className="p-4 sm:p-8">
          <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-gold-700">
            <Wand2 className="size-4" /> Busca do seu jeito
          </p>
          <h2 className="mt-1 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
            Conte como você mora que a gente acha o imóvel
          </h2>
          <p className="mt-1 max-w-3xl text-lg text-stone-600">
            Sem precisar entender de filtros: diga quem vai morar, se tem pets e
            carros — a gente calcula quartos, vagas e o resto. Pode marcar as
            opções ou simplesmente escrever.
          </p>

          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            {/* ===== Checklist ===== */}
            <div className="space-y-6">
              <fieldset>
                <legend className="inline-flex items-center gap-2 text-lg font-bold text-stone-900">
                  <Heart className="size-5 text-brand-700" /> Quem vai morar?
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {OPCOES_MORADORES.map((o) => (
                    <PilulaPerfil
                      key={o.value}
                      ativo={perfil.moradores === o.value}
                      onClick={() =>
                        muda({ moradores: perfil.moradores === o.value ? "" : o.value })
                      }
                      contagem={conta({ moradores: o.value })}
                    >
                      <span aria-hidden="true">{o.emoji}</span> {o.label}
                    </PilulaPerfil>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="inline-flex items-center gap-2 text-lg font-bold text-stone-900">
                  <Baby className="size-5 text-brand-700" /> Crianças ou filhos morando junto?
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <PilulaPerfil
                      key={n}
                      ativo={perfil.filhos === n}
                      onClick={() => muda({ filhos: n })}
                      contagem={conta({ filhos: n })}
                    >
                      {n === 0 ? "Nenhum" : n === 4 ? "4 ou mais" : n}
                    </PilulaPerfil>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="inline-flex items-center gap-2 text-lg font-bold text-stone-900">
                  <PawPrint className="size-5 text-brand-700" /> Tem cachorro, gato ou outro pet?
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  <PilulaPerfil
                    ativo={perfil.pets}
                    onClick={() => muda({ pets: true })}
                    contagem={conta({ pets: true })}
                  >
                    🐾 Sim
                  </PilulaPerfil>
                  <PilulaPerfil ativo={!perfil.pets} onClick={() => muda({ pets: false })}>
                    Não
                  </PilulaPerfil>
                </div>
                <p className="mt-2 text-sm text-stone-500">
                  Com pet, mostramos só imóveis que aceitam bichos.
                </p>
              </fieldset>

              <fieldset>
                <legend className="inline-flex items-center gap-2 text-lg font-bold text-stone-900">
                  <Car className="size-5 text-brand-700" /> Quantos carros precisam de vaga?
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <PilulaPerfil
                      key={n}
                      ativo={perfil.carros === n}
                      onClick={() => muda({ carros: n })}
                      contagem={conta({ carros: n })}
                    >
                      {n === 0 ? "Nenhum" : n === 4 ? "4 ou mais" : n}
                    </PilulaPerfil>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="inline-flex items-center gap-2 text-lg font-bold text-stone-900">
                  <Laptop className="size-5 text-brand-700" /> Alguém trabalha em casa?
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  <PilulaPerfil
                    ativo={perfil.homeOffice}
                    onClick={() => muda({ homeOffice: true })}
                    contagem={conta({ homeOffice: true })}
                  >
                    💻 Sim
                  </PilulaPerfil>
                  <PilulaPerfil
                    ativo={!perfil.homeOffice}
                    onClick={() => muda({ homeOffice: false })}
                  >
                    Não
                  </PilulaPerfil>
                </div>
                <p className="mt-2 text-sm text-stone-500">
                  Se sim, contamos um quarto a mais para o escritório.
                </p>
              </fieldset>
            </div>

            {/* ===== Ou escrever livremente ===== */}
            <div className="flex flex-col">
              <label className="block">
                <span className="text-lg font-bold text-stone-900">
                  Ou escreva do seu jeito ✍️
                </span>
                <span className="mt-1 block text-base text-stone-600">
                  Conforme você escreve, as opções ao lado se marcam sozinhas.
                </span>
                <textarea
                  value={texto}
                  onChange={(e) => aoEscrever(e.target.value.slice(0, 400))}
                  rows={5}
                  placeholder="Ex.: Somos um casal com 2 filhos e um cachorro, temos 2 carros e eu trabalho em casa. Queremos uma casa com quintal."
                  className="mt-3 w-full rounded-2xl border-2 border-stone-300 bg-white p-4 text-lg text-stone-900 placeholder:text-stone-400 focus:border-brand-600 focus:outline-none"
                />
              </label>

              {/* O que a gente entendeu */}
              <div className="mt-5 rounded-2xl bg-brand-50 p-5">
                <p className="text-base font-bold uppercase tracking-wider text-brand-800">
                  Entendemos assim
                </p>
                {entendido.length || filtros.length ? (
                  <>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {entendido.map((r) => (
                        <span
                          key={r}
                          className="anim-pop inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-base font-semibold text-brand-900 shadow-sm"
                        >
                          <Check className="size-4 text-brand-700" strokeWidth={3} /> {r}
                        </span>
                      ))}
                    </div>
                    {filtros.length > 0 && (
                      <p className="mt-3 text-lg text-stone-700">
                        Vamos procurar:{" "}
                        <strong className="text-stone-900">{filtros.join(" · ")}</strong>
                        {quartosSugeridos(perfil) > 0 && (
                          <span className="block text-base text-stone-500">
                            (quartos calculados pela quantidade de pessoas — dá para
                            ajustar depois na busca completa)
                          </span>
                        )}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-lg text-stone-600">
                    Marque as opções ou escreva ao lado — o resumo aparece aqui.
                  </p>
                )}
              </div>

              {/* Resultado + botão */}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={buscando || !preenchido}
                  className="botao-brilho group relative inline-flex min-h-16 flex-1 items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gold-400 px-8 text-xl font-extrabold text-gold-950 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-gold-300 active:scale-95 disabled:opacity-60"
                >
                  {buscando ? (
                    <>
                      <Spinner className="border-gold-700/30 border-t-gold-950" /> Buscando…
                    </>
                  ) : (
                    <>
                      <Search className="size-6" />
                      {preenchido ? (
                        <span>
                          Ver{" "}
                          <span key={total} className="anim-pop inline-block">
                            {total}
                          </span>{" "}
                          {total === 1 ? "imóvel para você" : "imóveis para você"}
                        </span>
                      ) : (
                        "Conte como você mora"
                      )}
                      <ArrowRight className="size-6 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
                {preenchido && (
                  <button
                    type="button"
                    onClick={() => {
                      setPerfil(PERFIL_VAZIO);
                      setTexto("");
                    }}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-lg font-semibold text-stone-500 transition-colors hover:text-stone-900"
                  >
                    <RotateCcw className="size-5" /> Começar de novo
                  </button>
                )}
              </div>
              {preenchido && total === 0 && (
                <p className="anim-entra mt-4 rounded-2xl bg-gold-50 p-4 text-lg text-gold-950">
                  Nenhum imóvel com tudo isso agora. Tire alguma opção ou use a{" "}
                  <a href="#busca" className="font-bold text-brand-800 underline">
                    busca completa
                  </a>{" "}
                  para afinar.
                </p>
              )}
            </div>
          </div>

          {/* ===== Mapa da cidade embutido (pedido da dona, nov/2026):
              o mapa "Onde fica cada coisa" do /cidade, dentro da busca —
              o cliente vê mercados, escolas, farmácias e os condomínios
              enquanto decide onde quer morar. Só lugares públicos: nunca a
              posição de um imóvel. ===== */}
          <div className="mt-10 border-t-2 border-stone-100 pt-8">
            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-gold-700">
              <span aria-hidden="true">🗺️</span> Onde fica cada coisa
            </p>
            <h3 className="mt-1 font-display text-2xl font-bold text-stone-900 sm:text-3xl">
              Escolha o lugar olhando o mapa da cidade
            </h3>
            <p className="mt-1 max-w-3xl text-lg text-stone-600">
              Toque numa categoria para ver onde ficam mercados, farmácias,
              escolas, hospitais e os condomínios de Bragança Paulista.
            </p>
            <div className="mt-5">
              <MapaEstabelecimentos compacto />
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}

function PilulaPerfil({
  ativo,
  onClick,
  contagem,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  contagem?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-12 items-center gap-2 rounded-full border-2 px-4 text-base font-semibold transition-all duration-300 hover:-translate-y-0.5 active:scale-95",
        ativo
          ? "border-brand-800 bg-brand-800 text-white shadow-md"
          : "border-stone-200 bg-white text-stone-700 hover:border-brand-400",
      )}
    >
      {ativo && <Check className="anim-pop size-4" strokeWidth={3} />}
      {children}
      {contagem !== undefined && (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-bold",
            ativo ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500",
          )}
        >
          {contagem}
        </span>
      )}
    </button>
  );
}
