"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Briefcase,
  Building,
  Building2,
  Car,
  Check,
  ChevronDown,
  ChevronUp,
  Fence,
  Gem,
  Home,
  House,
  HousePlus,
  LandPlot,
  type LucideIcon,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Navigation,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Store,
  Tractor,
  Trees,
  Warehouse,
  X,
} from "lucide-react";
import { MoneyInput } from "@/components/ui/money-input";
import { Spinner } from "@/components/ui/spinner";
import { CATEGORIAS_LUGAR } from "@/lib/cidade/categorias";
import {
  BUSCA_VAZIA,
  CIDADE_PRINCIPAL,
  DISTANCIAS_PERTO,
  FINALIDADES_BUSCA,
  GRUPOS_TIPO,
  MOBILIA_BUSCA,
  ORDENS_BUSCA,
  REGIAO_DO_BAIRRO,
  combina,
  condominiosDisponiveis,
  ehCondominioDestaque,
  locaisDisponiveis,
  paraQuery,
  resumoBusca,
  rotuloLocal,
  type Busca,
  type ItemBusca,
} from "@/lib/busca-site";
import { cn } from "@/lib/cn";
import { AMENITIES, AMENITY_CATEGORIES, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { waHref } from "@/lib/whatsapp";

const ICONE_TIPO: Record<string, LucideIcon> = {
  CASA: House,
  CASA_CONDOMINIO: HousePlus,
  SOBRADO: Home,
  APARTAMENTO: Building2,
  COBERTURA: Gem,
  KITNET: BedDouble,
  CHACARA: Trees,
  SITIO: Sprout,
  FAZENDA: Tractor,
  TERRENO: LandPlot,
  TERRENO_CONDOMINIO: Fence,
  AREA_LOTE: MapIcon,
  GALPAO: Warehouse,
  SALA_COMERCIAL: Briefcase,
  LOJA: Store,
  PREDIO_COMERCIAL: Building,
};

// Atalhos de valor máximo (mudam conforme comprar/alugar)
const ATALHOS_VENDA = [300_000, 500_000, 800_000, 1_200_000, 2_000_000];
const ATALHOS_ALUGUEL = [1_500, 2_500, 4_000, 6_000];

function valorCurto(v: number): string {
  if (v >= 1_000_000) {
    const mi = (v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
    return `R$ ${mi} ${v >= 2_000_000 ? "milhões" : "milhão"}`;
  }
  if (v >= 10_000) return `R$ ${v / 1000} mil`;
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function alterna<T>(lista: T[], item: T): T[] {
  return lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item];
}

/**
 * Caixa de busca do site: tudo o que o cadastro do corretor tem de público,
 * com contagem ao vivo (mesma regra do servidor, em lib/busca-site.ts).
 * Ao buscar, vai para /site?…#imoveis — o link da busca pode ser enviado.
 */
export function BuscaImoveis({
  itens,
  inicial,
  whatsapp,
}: {
  itens: ItemBusca[];
  inicial: Busca;
  whatsapp: string | null;
}) {
  const router = useRouter();
  const [busca, setBusca] = useState<Busca>(inicial);
  const [maisFiltros, setMaisFiltros] = useState(
    () =>
      inicial.areaMin !== null ||
      inicial.areaMax !== null ||
      inicial.comodidades.length > 0 ||
      inicial.financiamento ||
      inicial.fgts ||
      inicial.pet ||
      inicial.mobilia !== "" ||
      inicial.texto !== "" ||
      inicial.ordem !== "recentes" ||
      inicial.suites > 0 ||
      inicial.banheiros > 0,
  );
  const [filtroLocal, setFiltroLocal] = useState("");
  const [todosBairros, setTodosBairros] = useState(false);
  const [todosCondominios, setTodosCondominios] = useState(false);
  const [buscando, startTransition] = useTransition();

  const muda = (parcial: Partial<Busca>) => setBusca((b) => ({ ...b, ...parcial }));
  const conta = (parcial: Partial<Busca>) =>
    itens.reduce((n, i) => n + (combina(i, { ...busca, ...parcial }) ? 1 : 0), 0);

  const total = useMemo(
    () => itens.reduce((n, i) => n + (combina(i, busca) ? 1 : 0), 0),
    [itens, busca],
  );
  const locais = useMemo(() => locaisDisponiveis(itens), [itens]);
  const condominios = useMemo(() => condominiosDisponiveis(itens), [itens]);
  const destaques = useMemo(
    () => new Set(condominios.filter(ehCondominioDestaque)),
    [condominios],
  );
  // O que tem imóvel publicado aparece sempre, sem precisar abrir a lista
  const comImovel = useMemo(
    () =>
      new Set(
        itens.flatMap((i) => [
          ...(i.bairro ? [`${i.bairro}, ${i.cidade}`] : []),
          ...(i.condominio ? [i.condominio] : []),
        ]),
      ),
    [itens],
  );
  const temPerto =
    busca.perto.length > 0 || itens.some((i) => Object.keys(i.perto).length > 0);
  const variasCidades = locais.length > 1;
  const totalBairros = locais.reduce((n, l) => n + l.bairros.length, 0);

  const termoLocal = semAcento(filtroLocal.trim());
  const procurando = termoLocal.length > 0;
  const confere = (nome: string) => semAcento(nome).includes(termoLocal);
  const condominiosVisiveis = condominios.filter((c) =>
    procurando
      ? confere(c)
      : todosCondominios ||
        destaques.has(c) ||
        comImovel.has(c) ||
        busca.condominios.includes(c),
  );
  const gruposBairros: { chave: string; titulo: string | null; opcoes: string[] }[] = locais.flatMap(({ cidade, bairros }) => {
    const visiveis = bairros.filter((b) => {
      const local = `${b}, ${cidade}`;
      return procurando
        ? confere(b)
        : todosBairros || comImovel.has(local) || busca.locais.includes(local);
    });
    const cidadeInteira = variasCidades && (!procurando || confere(cidade)) ? [cidade] : [];
    if (visiveis.length + cidadeInteira.length === 0) return [];
    const titulo = variasCidades ? cidade : null;
    // Lista completa de Bragança: agrupada por região (indicativa)
    if (cidade === CIDADE_PRINCIPAL && todosBairros && !procurando) {
      const porRegiao = new Map<string, string[]>();
      for (const b of visiveis) {
        const r = REGIAO_DO_BAIRRO[b] ?? "Outros bairros";
        porRegiao.set(r, [...(porRegiao.get(r) ?? []), `${b}, ${cidade}`]);
      }
      return [
        ...(cidadeInteira.length
          ? [{ chave: cidade, titulo, opcoes: cidadeInteira }]
          : []),
        ...[...porRegiao].map(([r, opcoes]) => ({
          chave: `${cidade}-${r}`,
          titulo: variasCidades ? `${cidade} · ${r}` : r,
          opcoes,
        })),
      ];
    }
    return [
      { chave: cidade, titulo, opcoes: [...cidadeInteira, ...visiveis.map((b) => `${b}, ${cidade}`)] },
    ];
  });
  const bairrosVisiveis = gruposBairros.reduce(
    (n, g) => n + g.opcoes.filter((o) => o.includes(", ")).length,
    0,
  );
  const resumo = resumoBusca(busca);
  const indiceFinalidade = Math.max(
    0,
    FINALIDADES_BUSCA.findIndex((f) => f.value === busca.finalidade),
  );
  const atalhosValor = busca.finalidade === "alugar" ? ATALHOS_ALUGUEL : ATALHOS_VENDA;
  const avancados =
    (busca.areaMin !== null || busca.areaMax !== null ? 1 : 0) +
    busca.comodidades.length +
    (busca.financiamento ? 1 : 0) +
    (busca.fgts ? 1 : 0) +
    (busca.pet ? 1 : 0) +
    (busca.mobilia ? 1 : 0) +
    (busca.texto ? 1 : 0) +
    (busca.suites ? 1 : 0) +
    (busca.banheiros ? 1 : 0);

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    const q = paraQuery(busca);
    startTransition(() => router.push(`/site${q ? `?${q}` : ""}#imoveis`));
  }

  const zapSemResultado = waHref(
    whatsapp,
    `Olá! Procurei no site da FC Imóveis${resumo.length ? ` (${resumo.join(" · ")})` : ""} e não encontrei. Podem me ajudar a achar?`,
  );

  return (
    <section
      id="busca"
      aria-label="Buscar imóveis"
      className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-4 pt-10 sm:px-6"
    >
      <form
        onSubmit={buscar}
        className="anim-entra relative overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-stone-200"
      >
        {/* Faixa dourada animada no topo */}
        <div className="busca-faixa h-1.5" aria-hidden="true" />

        <div className="p-4 sm:p-8">
          {/* Cabeçalho + contador ao vivo */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-gold-700">
                <Sparkles className="size-4" /> Busca de imóveis
              </p>
              <h2 className="mt-1 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
                O que você procura?
              </h2>
              <p className="mt-1 text-lg text-stone-600">
                Escolha do seu jeito — o número de imóveis muda na hora.
              </p>
            </div>
            <div
              className="flex items-center gap-3 rounded-2xl bg-brand-950 px-5 py-3 text-white shadow-lg"
              aria-live="polite"
            >
              <span className="relative flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold-300 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-gold-400" />
              </span>
              <span
                key={total}
                className="anim-pop font-display text-4xl font-bold leading-none text-gold-300"
              >
                {total}
              </span>
              <span className="text-base leading-tight text-brand-100">
                {total === 1 ? "imóvel" : "imóveis"}
                <br />
                {total === 1 ? "combina" : "combinam"}
              </span>
            </div>
          </div>

          {/* Finalidade: abas com marcador deslizante */}
          <div
            role="radiogroup"
            aria-label="Finalidade"
            className="relative mt-6 grid grid-cols-4 rounded-2xl bg-stone-100 p-1"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-1 left-1 rounded-xl bg-brand-800 shadow-md transition-transform duration-500 ease-[cubic-bezier(.34,1.56,.64,1)]"
              style={{
                width: "calc((100% - 0.5rem) / 4)",
                transform: `translateX(${indiceFinalidade * 100}%)`,
              }}
            />
            {FINALIDADES_BUSCA.map((f) => {
              const ativo = busca.finalidade === f.value;
              return (
                <button
                  key={f.value || "todos"}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  onClick={() => muda({ finalidade: f.value })}
                  className={cn(
                    "relative z-10 flex min-h-14 flex-col items-center justify-center rounded-xl px-0.5 text-sm font-bold transition-colors duration-300 sm:text-lg",
                    ativo ? "text-white" : "text-stone-600 hover:text-brand-800",
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      ativo ? "text-gold-300" : "text-stone-400",
                    )}
                  >
                    {conta({ finalidade: f.value })}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tipos de imóvel: cartões com ícone (vários ao mesmo tempo) */}
          <fieldset className="mt-7">
            <legend className="flex w-full items-center justify-between text-lg font-bold text-stone-900">
              Tipo de imóvel
              {busca.tipos.length > 0 && (
                <button
                  type="button"
                  onClick={() => muda({ tipos: [] })}
                  className="text-base font-semibold text-brand-700 hover:underline"
                >
                  Qualquer tipo
                </button>
              )}
            </legend>
            <div className="mt-3 space-y-4">
              {GRUPOS_TIPO.map((g) => (
                <div key={g.label}>
                  <p className="mb-2 text-sm font-bold uppercase tracking-wider text-stone-400">
                    {g.label}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    {g.tipos.map((t) => {
                      const Icone = ICONE_TIPO[t] ?? House;
                      const ativo = busca.tipos.includes(t);
                      const n = conta({ tipos: [t] });
                      return (
                        <button
                          key={t}
                          type="button"
                          aria-pressed={ativo}
                          onClick={() => muda({ tipos: alterna(busca.tipos, t) })}
                          className={cn(
                            "group relative flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-95",
                            ativo
                              ? "scale-[1.03] border-gold-400 bg-gold-50 shadow-lg shadow-gold-200"
                              : "border-stone-200 bg-white hover:border-brand-300",
                            !ativo && n === 0 && "opacity-55",
                          )}
                        >
                          {ativo && (
                            <span className="anim-pop absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-gold-400 text-gold-950">
                              <Check className="size-4" strokeWidth={3} />
                            </span>
                          )}
                          <Icone
                            className={cn(
                              "size-8 transition-transform duration-300 group-hover:scale-110",
                              ativo ? "text-gold-700" : "text-brand-700",
                            )}
                          />
                          <span className="text-base font-semibold leading-tight text-stone-800">
                            {PROPERTY_TYPE_LABELS[t]}
                          </span>
                          <span className="text-xs font-semibold text-stone-400">
                            {n} {n === 1 ? "imóvel" : "imóveis"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          {/* Onde: lista oficial de bairros e condomínios de Bragança (mais os
              das outras cidades com imóvel publicado). Para não virar um
              paredão, mostra primeiro os que têm imóvel; o resto em "Ver todos"
              ou digitando. */}
          <fieldset className="mt-7">
            <legend className="flex w-full items-center justify-between text-lg font-bold text-stone-900">
              <span className="inline-flex items-center gap-2">
                <MapPin className="size-5 text-brand-700" /> Onde?
              </span>
              {busca.locais.length + busca.condominios.length > 0 && (
                <button
                  type="button"
                  onClick={() => muda({ locais: [], condominios: [] })}
                  className="text-base font-semibold text-brand-700 hover:underline"
                >
                  Qualquer lugar
                </button>
              )}
            </legend>
            <input
              type="search"
              value={filtroLocal}
              onChange={(e) => setFiltroLocal(e.target.value)}
              placeholder="Digite o bairro ou o condomínio…"
              aria-label="Procurar bairro ou condomínio"
              className="mt-3 w-full min-h-12 rounded-xl border-2 border-stone-300 bg-white px-4 text-stone-900 placeholder:text-stone-400 focus:border-brand-600 focus:outline-none sm:max-w-md"
            />

            <p className="mb-2 mt-5 text-sm font-bold uppercase tracking-wider text-stone-400">
              Condomínios
            </p>
            {condominiosVisiveis.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {condominiosVisiveis.map((c) => {
                  const destaque = destaques.has(c);
                  return (
                    <Pilula
                      key={c}
                      ativo={busca.condominios.includes(c)}
                      onClick={() => muda({ condominios: alterna(busca.condominios, c) })}
                      contagem={conta({ locais: [], condominios: [c] })}
                      destaque={destaque}
                    >
                      {destaque && (
                        <span aria-label="Condomínio principal" className="text-lg text-gold-500">
                          ★
                        </span>
                      )}
                      {c}
                    </Pilula>
                  );
                })}
              </div>
            ) : (
              <p className="text-base text-stone-500">Nenhum condomínio com esse nome.</p>
            )}
            {!procurando && (todosCondominios || condominiosVisiveis.length < condominios.length) && (
              <VerTodos
                aberto={todosCondominios}
                onClick={() => setTodosCondominios((v) => !v)}
                texto={`Ver todos os ${condominios.length} condomínios`}
              />
            )}

            <p className="mb-2 mt-6 text-sm font-bold uppercase tracking-wider text-stone-400">
              Bairros
            </p>
            {gruposBairros.length > 0 ? (
              <div className="space-y-4">
                {gruposBairros.map(({ chave, titulo, opcoes }) => (
                  <div key={chave}>
                    {titulo && (
                      <p className="mb-2 text-sm font-bold uppercase tracking-wider text-stone-400">
                        {titulo}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {opcoes.map((local) => (
                        <Pilula
                          key={local}
                          ativo={busca.locais.includes(local)}
                          onClick={() => muda({ locais: alterna(busca.locais, local) })}
                          contagem={conta({ locais: [local], condominios: [] })}
                        >
                          {rotuloLocal(local)}
                        </Pilula>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-base text-stone-500">
                {procurando
                  ? "Nenhum bairro com esse nome."
                  : "Ainda não há imóvel publicado com bairro. Veja a lista completa:"}
              </p>
            )}
            {!procurando && (todosBairros || bairrosVisiveis < totalBairros) && (
              <VerTodos
                aberto={todosBairros}
                onClick={() => setTodosBairros((v) => !v)}
                texto={`Ver todos os ${totalBairros} bairros`}
              />
            )}
          </fieldset>

          {/* Perto de: só faixas de distância (calculadas no servidor) */}
          {temPerto && (
            <fieldset className="mt-7">
              <legend className="flex w-full items-center justify-between text-lg font-bold text-stone-900">
                <span className="inline-flex items-center gap-2">
                  <Navigation className="size-5 text-brand-700" /> Perto de
                </span>
                {busca.perto.length > 0 && (
                  <button
                    type="button"
                    onClick={() => muda({ perto: [] })}
                    className="text-base font-semibold text-brand-700 hover:underline"
                  >
                    Tanto faz
                  </button>
                )}
              </legend>
              <p className="mt-1 text-base text-stone-600">
                O que você quer ter por perto do imóvel?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {CATEGORIAS_LUGAR.map((c) => (
                  <Pilula
                    key={c.value}
                    ativo={busca.perto.includes(c.value)}
                    onClick={() => muda({ perto: alterna(busca.perto, c.value) })}
                    contagem={conta({ perto: [c.value] })}
                  >
                    <span aria-hidden="true">{c.emoji}</span>
                    {c.label}
                  </Pilula>
                ))}
              </div>
              {busca.perto.length > 0 && (
                <div className="anim-entra mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-stone-700">A no máximo:</span>
                  {DISTANCIAS_PERTO.map((m) => (
                    <Pilula
                      key={m}
                      ativo={busca.distancia === m}
                      onClick={() => muda({ distancia: m })}
                      contagem={conta({ distancia: m })}
                    >
                      {m < 1000 ? `${m} m` : `${m / 1000} km`}
                    </Pilula>
                  ))}
                </div>
              )}
              <p className="mt-2 text-sm text-stone-500">
                Distância aproximada, em linha reta.
              </p>
            </fieldset>
          )}

          {/* Quartos e vagas (os principais); suítes e banheiros em "Mais filtros" */}
          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            <Contador
              icone={BedDouble}
              rotulo="Quartos"
              valor={busca.quartos}
              onChange={(n) => muda({ quartos: n })}
            />
            <Contador
              icone={Car}
              rotulo="Vagas de garagem"
              valor={busca.vagas}
              onChange={(n) => muda({ vagas: n })}
            />
          </div>

          {/* Valor */}
          <fieldset className="mt-7">
            <legend className="text-lg font-bold text-stone-900">
              Valor {busca.finalidade === "alugar" ? "do aluguel (por mês)" : ""}
            </legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-stone-600">
                  A partir de
                </span>
                <MoneyInput
                  value={busca.valorMin}
                  onChange={(v) => muda({ valorMin: v })}
                  placeholder="Sem mínimo"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-stone-600">
                  Até
                </span>
                <MoneyInput
                  value={busca.valorMax}
                  onChange={(v) => muda({ valorMax: v })}
                  placeholder="Sem máximo"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {atalhosValor.map((v) => (
                <Pilula
                  key={v}
                  ativo={busca.valorMax === v && busca.valorMin === null}
                  onClick={() =>
                    muda(
                      busca.valorMax === v && busca.valorMin === null
                        ? { valorMax: null }
                        : { valorMin: null, valorMax: v },
                    )
                  }
                >
                  até {valorCurto(v)}
                </Pilula>
              ))}
            </div>
          </fieldset>

          {/* Mais filtros: abre com animação */}
          <button
            type="button"
            onClick={() => setMaisFiltros((v) => !v)}
            aria-expanded={maisFiltros}
            className="mt-7 flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 px-5 py-4 text-lg font-bold text-brand-900 transition-colors hover:border-brand-500 hover:bg-brand-100"
          >
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal className="size-5" /> Mais filtros
              {avancados > 0 && (
                <span className="anim-pop rounded-full bg-gold-400 px-2.5 py-0.5 text-sm text-gold-950">
                  {avancados}
                </span>
              )}
            </span>
            <span className="inline-flex items-center gap-2 text-base font-semibold text-brand-700">
              <span className="hidden sm:inline">suítes, área, comodidades, financiamento…</span>
              <ChevronDown
                className={cn(
                  "size-6 transition-transform duration-500",
                  maisFiltros && "rotate-180",
                )}
              />
            </span>
          </button>
          <div
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-500 ease-out",
              maisFiltros ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="overflow-hidden" inert={!maisFiltros}>
              <div className="space-y-7 pt-6">
                <div className="grid gap-5 lg:grid-cols-2">
                  <Contador
                    icone={BedDouble}
                    rotulo="Suítes"
                    valor={busca.suites}
                    onChange={(n) => muda({ suites: n })}
                  />
                  <Contador
                    icone={Bath}
                    rotulo="Banheiros"
                    valor={busca.banheiros}
                    onChange={(n) => muda({ banheiros: n })}
                  />
                </div>

                <fieldset>
                  <legend className="text-lg font-bold text-stone-900">Área (m²)</legend>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <CampoArea
                      rotulo="A partir de"
                      valor={busca.areaMin}
                      onChange={(v) => muda({ areaMin: v })}
                    />
                    <CampoArea
                      rotulo="Até"
                      valor={busca.areaMax}
                      onChange={(v) => muda({ areaMax: v })}
                    />
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-lg font-bold text-stone-900">
                    Condições e mobília
                  </legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pilula
                      ativo={busca.financiamento}
                      onClick={() => muda({ financiamento: !busca.financiamento })}
                      contagem={conta({ financiamento: true })}
                    >
                      Aceita financiamento
                    </Pilula>
                    <Pilula
                      ativo={busca.fgts}
                      onClick={() => muda({ fgts: !busca.fgts })}
                      contagem={conta({ fgts: true })}
                    >
                      Aceita FGTS
                    </Pilula>
                    <Pilula
                      ativo={busca.pet}
                      onClick={() => muda({ pet: !busca.pet })}
                      contagem={conta({ pet: true })}
                    >
                      🐾 Aceita pet
                    </Pilula>
                    {MOBILIA_BUSCA.map((m) => (
                      <Pilula
                        key={m.value}
                        ativo={busca.mobilia === m.value}
                        onClick={() =>
                          muda({ mobilia: busca.mobilia === m.value ? "" : m.value })
                        }
                        contagem={conta({ mobilia: m.value })}
                      >
                        {m.label}
                      </Pilula>
                    ))}
                  </div>
                </fieldset>

                {AMENITY_CATEGORIES.map((cat) => (
                  <fieldset key={cat.value}>
                    <legend className="text-lg font-bold text-stone-900">{cat.label}</legend>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {AMENITIES.filter((a) => a.category === cat.value).map((a) => {
                        const ativo = busca.comodidades.includes(a.key);
                        return (
                          <Pilula
                            key={a.key}
                            ativo={ativo}
                            onClick={() =>
                              muda({ comodidades: alterna(busca.comodidades, a.key) })
                            }
                            contagem={conta({
                              comodidades: ativo
                                ? busca.comodidades
                                : [...busca.comodidades, a.key],
                            })}
                          >
                            {a.label}
                          </Pilula>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-lg font-bold text-stone-900">
                      Código ou palavra
                    </span>
                    <input
                      type="search"
                      value={busca.texto}
                      onChange={(e) => muda({ texto: e.target.value.slice(0, 80) })}
                      placeholder="Ex.: FC-0012 ou Centro"
                      className="w-full min-h-12 rounded-xl border-2 border-stone-300 bg-white px-4 text-stone-900 placeholder:text-stone-400 focus:border-brand-600 focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-lg font-bold text-stone-900">
                      Mostrar primeiro
                    </span>
                    <select
                      value={busca.ordem}
                      onChange={(e) => muda({ ordem: e.target.value })}
                      className="w-full min-h-12 rounded-xl border-2 border-stone-300 bg-white px-4 text-stone-900 focus:border-brand-600 focus:outline-none"
                    >
                      {ORDENS_BUSCA.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* O que foi escolhido (toque no X para tirar) */}
          {resumo.length > 0 && (
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-stone-500">Você escolheu:</span>
              {chipsAtivos(busca, muda).map((c) => (
                <button
                  key={c.chave}
                  type="button"
                  onClick={c.remover}
                  className="anim-pop inline-flex min-h-10 items-center gap-1.5 rounded-full bg-brand-900 py-1 pl-4 pr-2 text-base font-semibold text-white transition-colors hover:bg-red-700"
                  aria-label={`Tirar ${c.rotulo}`}
                >
                  {c.rotulo}
                  <X className="size-5 rounded-full bg-white/15 p-0.5" />
                </button>
              ))}
            </div>
          )}

          {/* Rodapé: limpar + ver resultados */}
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-stone-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => {
                setBusca(BUSCA_VAZIA);
                setFiltroLocal("");
              }}
              disabled={resumo.length === 0}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-lg font-semibold text-stone-500 transition-colors hover:text-stone-900 disabled:invisible"
            >
              <RotateCcw className="size-5" /> Limpar tudo
            </button>
            <button
              type="submit"
              disabled={buscando}
              className="botao-brilho group relative inline-flex min-h-16 items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gold-400 px-8 text-xl font-extrabold text-gold-950 shadow-xl shadow-gold-300/50 transition-all hover:-translate-y-0.5 hover:bg-gold-300 active:scale-95 disabled:opacity-80"
            >
              {buscando ? (
                <>
                  <Spinner className="border-gold-700/30 border-t-gold-950" /> Buscando…
                </>
              ) : (
                <>
                  <Search className="size-6" />
                  {total === 0 ? (
                    "Ver busca"
                  ) : (
                    <span>
                      Ver{" "}
                      <span key={total} className="anim-pop inline-block">
                        {total}
                      </span>{" "}
                      {total === 1 ? "imóvel" : "imóveis"}
                    </span>
                  )}
                  <ArrowRight className="size-6 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
          {total === 0 && (
            <p className="anim-entra mt-4 rounded-2xl bg-gold-50 p-4 text-lg text-gold-950">
              Nenhum imóvel com tudo isso ainda. Tire algum filtro
              {zapSemResultado ? (
                <>
                  {" "}
                  ou{" "}
                  <a
                    href={zapSemResultado}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-brand-800 underline"
                  >
                    <MessageCircle className="size-5" /> fale com a gente
                  </a>{" "}
                  — procuramos para você.
                </>
              ) : (
                "."
              )}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}

function chipsAtivos(
  b: Busca,
  muda: (parcial: Partial<Busca>) => void,
): { chave: string; rotulo: string; remover: () => void }[] {
  const chips: { chave: string; rotulo: string; remover: () => void }[] = [];
  const fin = FINALIDADES_BUSCA.find((f) => f.value === b.finalidade);
  if (b.finalidade && fin)
    chips.push({ chave: "fin", rotulo: fin.label, remover: () => muda({ finalidade: "" }) });
  for (const t of b.tipos)
    chips.push({
      chave: `t-${t}`,
      rotulo: PROPERTY_TYPE_LABELS[t] ?? t,
      remover: () => muda({ tipos: b.tipos.filter((x) => x !== t) }),
    });
  for (const l of b.locais)
    chips.push({
      chave: `l-${l}`,
      rotulo: rotuloLocal(l),
      remover: () => muda({ locais: b.locais.filter((x) => x !== l) }),
    });
  for (const c of b.condominios)
    chips.push({
      chave: `c-${c}`,
      rotulo: c,
      remover: () => muda({ condominios: b.condominios.filter((x) => x !== c) }),
    });
  // O resto vem do mesmo resumo usado no servidor, sem repetir os de cima
  const ja = new Set(chips.map((c) => c.rotulo));
  const removedores: Record<string, Partial<Busca>> = {
    quartos: { quartos: 0 },
    suíte: { suites: 0 },
    banheiro: { banheiros: 0 },
    vaga: { vagas: 0 },
  };
  for (const rotulo of resumoBusca(b)) {
    if (ja.has(rotulo)) continue;
    let parcial: Partial<Busca> | undefined;
    if (rotulo.startsWith("Perto de ")) parcial = { perto: [] };
    else if (/quarto/.test(rotulo)) parcial = removedores.quartos;
    else if (/suíte/.test(rotulo)) parcial = removedores["suíte"];
    else if (/banheiro/.test(rotulo)) parcial = removedores.banheiro;
    else if (/vaga/.test(rotulo)) parcial = removedores.vaga;
    else if (/R\$/.test(rotulo)) parcial = { valorMin: null, valorMax: null };
    else if (/m²/.test(rotulo)) parcial = { areaMin: null, areaMax: null };
    else if (rotulo === "Aceita financiamento") parcial = { financiamento: false };
    else if (rotulo === "Aceita FGTS") parcial = { fgts: false };
    else if (rotulo === "Aceita pet") parcial = { pet: false };
    else if (MOBILIA_BUSCA.some((m) => m.label === rotulo)) parcial = { mobilia: "" };
    else if (rotulo.startsWith("“")) parcial = { texto: "" };
    else {
      const a = AMENITIES.find((x) => x.label === rotulo);
      if (a) parcial = { comodidades: b.comodidades.filter((c) => c !== a.key) };
    }
    if (parcial) {
      const p = parcial;
      chips.push({ chave: `r-${rotulo}`, rotulo, remover: () => muda(p) });
    }
  }
  return chips;
}

function VerTodos({
  aberto,
  onClick,
  texto,
}: {
  aberto: boolean;
  onClick: () => void;
  texto: string;
}) {
  const Icone = aberto ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={aberto}
      className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-full px-2 text-base font-bold text-brand-700 hover:underline"
    >
      <Icone className="size-5" />
      {aberto ? "Mostrar menos" : texto}
    </button>
  );
}

function Pilula({
  ativo,
  onClick,
  contagem,
  destaque = false,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  contagem?: number;
  destaque?: boolean;
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
          : destaque
            ? "border-gold-400 bg-gold-50 text-gold-950 shadow-sm hover:border-gold-500"
            : "border-stone-200 bg-white text-stone-700 hover:border-brand-400",
        !ativo && !destaque && contagem === 0 && "opacity-55",
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

const OPCOES_CONTADOR = [
  { valor: 0, rotulo: "Tanto faz" },
  { valor: 1, rotulo: "1+" },
  { valor: 2, rotulo: "2+" },
  { valor: 3, rotulo: "3+" },
  { valor: 4, rotulo: "4+" },
];

function Contador({
  icone: Icone,
  rotulo,
  valor,
  onChange,
}: {
  icone: LucideIcon;
  rotulo: string;
  valor: number;
  onChange: (n: number) => void;
}) {
  return (
    <fieldset>
      <legend className="inline-flex items-center gap-2 text-lg font-bold text-stone-900">
        <Icone className="size-5 text-brand-700" /> {rotulo}
      </legend>
      <div className="mt-3 grid grid-cols-[1.7fr_repeat(4,minmax(0,1fr))] gap-1.5 rounded-2xl bg-stone-100 p-1.5">
        {OPCOES_CONTADOR.map((o) => {
          const ativo = valor === o.valor;
          return (
            <button
              key={o.valor}
              type="button"
              aria-pressed={ativo}
              onClick={() => onChange(o.valor)}
              className={cn(
                "min-h-12 whitespace-nowrap rounded-xl px-1 text-base font-bold transition-all duration-300 active:scale-90",
                ativo
                  ? "scale-105 bg-white text-brand-900 shadow-md ring-2 ring-gold-400"
                  : "text-stone-500 hover:bg-white/70 hover:text-stone-800",
              )}
            >
              {o.rotulo}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function CampoArea({
  rotulo,
  valor,
  onChange,
}: {
  rotulo: string;
  valor: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-stone-600">{rotulo}</span>
      <span className="relative block">
        <input
          type="text"
          inputMode="numeric"
          value={valor ? valor.toLocaleString("pt-BR") : ""}
          onChange={(e) => {
            const n = Number.parseInt(e.target.value.replace(/\D/g, ""), 10);
            onChange(Number.isFinite(n) && n > 0 ? n : null);
          }}
          placeholder={rotulo === "Até" ? "Sem máximo" : "Sem mínimo"}
          className="w-full min-h-12 rounded-xl border-2 border-stone-300 bg-white pl-4 pr-14 text-stone-900 placeholder:text-stone-400 focus:border-brand-600 focus:outline-none"
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-semibold text-stone-500">
          m²
        </span>
      </span>
    </label>
  );
}
