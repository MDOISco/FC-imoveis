// Busca de imóveis do site público. Funções puras, usadas no servidor (lista
// de resultados) e no navegador (contagem ao vivo enquanto o cliente escolhe)
// — a mesma regra nos dois lados. Espelha o filtro interno do painel (busca,
// tipo, finalidade, ordem) e soma tudo o que o cadastro tem de público.
//
// Privacidade: o item de busca só carrega o que já aparece no anúncio. Bairro
// de imóvel "OCULTO" e valor "sob consulta" nem entram (senão a busca
// revelaria por eliminação). Rua/número/CEP nunca. A coordenada também não:
// o item leva só a FAIXA de distância até cada categoria de lugar ("Perto de").
import type { Property } from "@prisma/client";
import { BAIRROS, NOMES_BAIRROS, bairroPorNome } from "@/lib/cidade/bairros";
import {
  CATEGORIA_POR_VALOR,
  ehCategoriaLugar,
  type CategoriaLugar,
} from "@/lib/cidade/categorias";
import {
  CONDOMINIO_DESTAQUE,
  NOMES_CONDOMINIOS,
  condominioPorNome,
  ehCondominioDestaque,
  ordemCondominios,
} from "@/lib/cidade/condominios";
import { chaveNome } from "@/lib/cidade/nomes";
import { FAIXAS_M, faixaDe, faixaPorCategoria, pontoDoImovel, rotuloFaixa } from "@/lib/cidade/perto";
import {
  AMENITY_BY_KEY,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPES,
  parseAmenities,
  purposeIncludesRent,
  purposeIncludesSale,
  type Option,
} from "@/lib/constants";
import { formatArea, formatBRL } from "@/lib/format";

export { CONDOMINIO_DESTAQUE, ehCondominioDestaque };

/** Cidade da lista oficial de bairros e condomínios. */
export const CIDADE_PRINCIPAL = "Bragança Paulista";

function daCidadePrincipal(cidade: string): boolean {
  return chaveNome(cidade) === chaveNome(CIDADE_PRINCIPAL);
}

/** Região (indicativa) de cada bairro oficial, para agrupar na tela. */
export const REGIAO_DO_BAIRRO: Record<string, string> = Object.fromEntries(
  BAIRROS.map((b) => [b.nome, b.regiao]),
);

/** Distâncias que o cliente pode escolher em "Perto de" (metros). */
export const DISTANCIAS_PERTO: number[] = FAIXAS_M.slice(0, 3);

/** Só entra quem a equipe publicou na ficha ("Publicar no site"). */
export const SITE_BASE_WHERE = {
  status: "ATIVO",
  source: "CORRETOR",
  publishedOnSite: true,
};

export const TIPOS_COMERCIAIS = [
  "GALPAO",
  "SALA_COMERCIAL",
  "LOJA",
  "PREDIO_COMERCIAL",
];

export const GRUPOS_TIPO: { label: string; tipos: string[] }[] = (() => {
  const grupos = [
    {
      label: "Casas e apartamentos",
      tipos: ["CASA", "CASA_CONDOMINIO", "SOBRADO", "APARTAMENTO", "COBERTURA", "KITNET"],
    },
    { label: "Chácaras, sítios e fazendas", tipos: ["CHACARA", "SITIO", "FAZENDA"] },
    { label: "Terrenos", tipos: ["TERRENO", "TERRENO_CONDOMINIO", "AREA_LOTE"] },
    { label: "Comercial", tipos: TIPOS_COMERCIAIS },
  ];
  // Tipo novo cadastrado em constants.ts aparece sozinho em "Outros"
  const usados = new Set(grupos.flatMap((g) => g.tipos));
  const outros = PROPERTY_TYPES.map((t) => t.value).filter((t) => !usados.has(t));
  return outros.length ? [...grupos, { label: "Outros", tipos: outros }] : grupos;
})();

export const FINALIDADES_BUSCA: Option[] = [
  { value: "", label: "Todos" },
  { value: "comprar", label: "Comprar" },
  { value: "alugar", label: "Alugar" },
  { value: "permuta", label: "Permuta" },
];

export const ORDENS_BUSCA: Option[] = [
  { value: "recentes", label: "Mais recentes" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
  { value: "maior-area", label: "Maior área" },
];

export const MOBILIA_BUSCA: Option[] = [
  { value: "SIM", label: "Mobiliado" },
  { value: "SEMI", label: "Semimobiliado" },
  { value: "NAO", label: "Sem móveis" },
];

/** Dados públicos de um imóvel, no formato que a busca entende. */
export type ItemBusca = {
  id: string;
  refCode: string;
  title: string;
  venda: boolean;
  aluguel: boolean;
  permuta: boolean;
  tipo: string | null;
  cidade: string;
  bairro: string | null; // null quando o endereço é OCULTO
  condominio: string | null; // idem
  quartos: number;
  suites: number;
  banheiros: number;
  vagas: number;
  area: number | null;
  valorVenda: number | null; // null quando "sob consulta"
  valorAluguel: number | null;
  comodidades: string[];
  financiamento: boolean;
  fgts: boolean;
  pet: boolean;
  mobilia: string | null;
  atualizado: number;
  // Faixa (índice em FAIXAS_M) do lugar mais perto de cada categoria; vazio
  // quando o endereço é oculto ou a localização não é confiável
  perto: Partial<Record<CategoriaLugar, number>>;
};

export function paraItemBusca(p: Property): ItemBusca {
  const precoAberto = !p.priceOnRequest;
  const visivel = p.addressVisibility !== "OCULTO";
  const principal = daCidadePrincipal(p.city);
  const bairro = p.neighborhood?.trim() || null;
  const condominio = p.condoName?.trim() || null;
  const ponto = pontoDoImovel(p);
  return {
    id: p.id,
    refCode: p.refCode,
    title: p.title ?? "",
    venda: purposeIncludesSale(p.purpose),
    aluguel: purposeIncludesRent(p.purpose),
    permuta: p.acceptsTrade,
    tipo: p.propertyType,
    cidade: principal ? CIDADE_PRINCIPAL : p.city,
    // Nome oficial (cadastros antigos podem ter outra grafia)
    bairro: visivel && bairro ? (principal && bairroPorNome(bairro)?.nome) || bairro : null,
    condominio:
      visivel && condominio ? (principal && condominioPorNome(condominio)?.nome) || condominio : null,
    quartos: p.bedrooms ?? 0,
    suites: p.suites ?? 0,
    banheiros: p.bathrooms ?? 0,
    vagas: (p.parkingCovered ?? 0) + (p.parkingUncovered ?? 0),
    area: p.usableArea ?? p.totalArea ?? null,
    valorVenda: precoAberto && purposeIncludesSale(p.purpose) ? p.salePrice : null,
    valorAluguel: precoAberto && purposeIncludesRent(p.purpose) ? p.rentPrice : null,
    comodidades: parseAmenities(p.amenities),
    financiamento: p.acceptsFinancing,
    fgts: p.acceptsFgts,
    pet: p.acceptsPets,
    mobilia: p.furnished,
    atualizado: p.updatedAt.getTime(),
    perto: ponto ? faixaPorCategoria(ponto) : {},
  };
}

export type Busca = {
  finalidade: string; // "" | comprar | alugar | permuta
  tipos: string[]; // tokens de PROPERTY_TYPES
  locais: string[]; // "Cidade" ou "Bairro, Cidade"
  condominios: string[];
  quartos: number;
  suites: number;
  banheiros: number;
  vagas: number;
  valorMin: number | null;
  valorMax: number | null;
  areaMin: number | null;
  areaMax: number | null;
  comodidades: string[];
  financiamento: boolean;
  fgts: boolean;
  pet: boolean;
  mobilia: string;
  perto: CategoriaLugar[]; // todos precisam estar a até `distancia`
  distancia: number; // metros (um de DISTANCIAS_PERTO)
  texto: string;
  ordem: string;
};

export const BUSCA_VAZIA: Busca = {
  finalidade: "",
  tipos: [],
  locais: [],
  condominios: [],
  quartos: 0,
  suites: 0,
  banheiros: 0,
  vagas: 0,
  valorMin: null,
  valorMax: null,
  areaMin: null,
  areaMax: null,
  comodidades: [],
  financiamento: false,
  fgts: false,
  pet: false,
  mobilia: "",
  perto: [],
  distancia: 1000,
  texto: "",
  ordem: "recentes",
};

type Params = Record<string, string | string[] | undefined>;

function lista(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return (Array.isArray(v) ? v : [v]).map((s) => s.trim()).filter(Boolean);
}
function um(v: string | string[] | undefined): string {
  return lista(v)[0] ?? "";
}
function inteiro(v: string | string[] | undefined, max: number): number {
  const n = Number.parseInt(um(v), 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0;
}
function positivo(v: string | string[] | undefined): number | null {
  const n = Number.parseInt(um(v).replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function faixa(min: number | null, max: number | null): [number | null, number | null] {
  return min !== null && max !== null && min > max ? [max, min] : [min, max];
}

/** "Vila Motta, Bragança Paulista" → "Vila Mota, Bragança Paulista". */
function localOficial(local: string): string {
  const { cidade, bairro } = separarLocal(local);
  if (!daCidadePrincipal(cidade)) return local;
  if (bairro === null) return CIDADE_PRINCIPAL;
  return `${bairroPorNome(bairro)?.nome ?? bairro}, ${CIDADE_PRINCIPAL}`;
}

/** Lê a busca da URL, aceitando só valores conhecidos. */
export function lerBusca(params: Params): Busca {
  const tiposValidos = new Set(PROPERTY_TYPES.map((t) => t.value));
  const [valorMin, valorMax] = faixa(positivo(params.valorMin), positivo(params.valorMax));
  const [areaMin, areaMax] = faixa(positivo(params.areaMin), positivo(params.areaMax));
  const finalidade = um(params.finalidade);
  const ordem = um(params.ordem);
  const mobilia = um(params.mobilia);
  const distancia = Number.parseInt(um(params.distancia), 10);
  return {
    finalidade: FINALIDADES_BUSCA.some((f) => f.value === finalidade) ? finalidade : "",
    tipos: lista(params.tipo).filter((t) => tiposValidos.has(t)),
    locais: lista(params.local).slice(0, 40).map(localOficial),
    condominios: lista(params.condominio)
      .slice(0, 40)
      .map((c) => condominioPorNome(c)?.nome ?? c),
    quartos: inteiro(params.quartos, 4),
    suites: inteiro(params.suites, 4),
    banheiros: inteiro(params.banheiros, 4),
    vagas: inteiro(params.vagas, 4),
    valorMin,
    valorMax,
    areaMin,
    areaMax,
    comodidades: lista(params.comodidade).slice(0, 40),
    financiamento: um(params.financiamento) === "1",
    fgts: um(params.fgts) === "1",
    pet: um(params.pet) === "1",
    mobilia: MOBILIA_BUSCA.some((m) => m.value === mobilia) ? mobilia : "",
    perto: [...new Set(lista(params.perto).filter(ehCategoriaLugar))],
    distancia: DISTANCIAS_PERTO.includes(distancia) ? distancia : BUSCA_VAZIA.distancia,
    texto: um(params.busca).slice(0, 80),
    ordem: ORDENS_BUSCA.some((o) => o.value === ordem) ? ordem : "recentes",
  };
}

/** Monta a URL da busca só com o que foi escolhido (link fácil de mandar). */
export function paraQuery(b: Busca): string {
  const q = new URLSearchParams();
  if (b.finalidade) q.set("finalidade", b.finalidade);
  for (const t of b.tipos) q.append("tipo", t);
  for (const l of b.locais) q.append("local", l);
  for (const c of b.condominios) q.append("condominio", c);
  if (b.quartos) q.set("quartos", String(b.quartos));
  if (b.suites) q.set("suites", String(b.suites));
  if (b.banheiros) q.set("banheiros", String(b.banheiros));
  if (b.vagas) q.set("vagas", String(b.vagas));
  if (b.valorMin) q.set("valorMin", String(b.valorMin));
  if (b.valorMax) q.set("valorMax", String(b.valorMax));
  if (b.areaMin) q.set("areaMin", String(b.areaMin));
  if (b.areaMax) q.set("areaMax", String(b.areaMax));
  for (const c of b.comodidades) q.append("comodidade", c);
  if (b.financiamento) q.set("financiamento", "1");
  if (b.fgts) q.set("fgts", "1");
  if (b.pet) q.set("pet", "1");
  if (b.mobilia) q.set("mobilia", b.mobilia);
  for (const c of b.perto) q.append("perto", c);
  if (b.perto.length && b.distancia !== BUSCA_VAZIA.distancia) {
    q.set("distancia", String(b.distancia));
  }
  if (b.texto) q.set("busca", b.texto);
  if (b.ordem !== "recentes") q.set("ordem", b.ordem);
  return q.toString();
}

/** Algum filtro escolhido? (a ordem sozinha não conta como busca) */
export function buscaAtiva(b: Busca): boolean {
  return paraQuery({ ...b, ordem: "recentes" }) !== "";
}

/** "Bairro, Cidade" -> partes; "Cidade" -> só a cidade. */
export function separarLocal(local: string): { cidade: string; bairro: string | null } {
  const i = local.lastIndexOf(", ");
  return i > 0
    ? { bairro: local.slice(0, i), cidade: local.slice(i + 2) }
    : { cidade: local, bairro: null };
}

function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function precoDaFinalidade(i: ItemBusca, finalidade: string): (number | null)[] {
  if (finalidade === "alugar") return [i.valorAluguel];
  if (finalidade) return [i.valorVenda]; // comprar ou permuta
  return [i.valorVenda, i.valorAluguel];
}

function dentro(v: number | null, min: number | null, max: number | null): boolean {
  if (v === null) return false;
  return (min === null || v >= min) && (max === null || v <= max);
}

export function combina(i: ItemBusca, b: Busca): boolean {
  if (b.finalidade === "comprar" && !i.venda) return false;
  if (b.finalidade === "alugar" && !i.aluguel) return false;
  if (b.finalidade === "permuta" && !i.permuta) return false;
  if (b.tipos.length && (!i.tipo || !b.tipos.includes(i.tipo))) return false;
  // "Onde?": bairros/cidades e condomínios valem juntos (qualquer um serve)
  if (
    (b.locais.length || b.condominios.length) &&
    !b.locais.some((l) => {
      const { cidade, bairro } = separarLocal(l);
      return i.cidade === cidade && (bairro === null || i.bairro === bairro);
    }) &&
    !b.condominios.some((c) => i.condominio !== null && semAcento(c) === semAcento(i.condominio))
  )
    return false;
  if (i.quartos < b.quartos || i.suites < b.suites) return false;
  if (i.banheiros < b.banheiros || i.vagas < b.vagas) return false;
  if (
    (b.valorMin !== null || b.valorMax !== null) &&
    !precoDaFinalidade(i, b.finalidade).some((v) => dentro(v, b.valorMin, b.valorMax))
  )
    return false;
  if ((b.areaMin !== null || b.areaMax !== null) && !dentro(i.area, b.areaMin, b.areaMax))
    return false;
  if (b.comodidades.some((c) => !i.comodidades.includes(c))) return false;
  if ((b.financiamento && !i.financiamento) || (b.fgts && !i.fgts)) return false;
  if (b.pet && !i.pet) return false;
  if (b.mobilia && i.mobilia !== b.mobilia) return false;
  if (b.perto.length) {
    const limite = faixaDe(b.distancia) ?? 0;
    if (b.perto.some((c) => (i.perto[c] ?? Infinity) > limite)) return false;
  }
  if (b.texto) {
    const t = semAcento(b.texto);
    // "FC 12", "fc-0012" ou só "12" acham o FC-0012
    const codigo = t.match(/^(?:fc)?[\s-]*0*(\d{1,6})$/);
    if (codigo) {
      if (Number(i.refCode.replace(/\D/g, "")) !== Number(codigo[1])) return false;
    } else if (!semAcento(`${i.refCode} ${i.title} ${i.bairro ?? ""} ${i.condominio ?? ""}`).includes(t)) {
      return false;
    }
  }
  return true;
}

export function filtrar(itens: ItemBusca[], b: Busca): ItemBusca[] {
  return itens.filter((i) => combina(i, b));
}

export function ordenar(itens: ItemBusca[], b: Busca): ItemBusca[] {
  const lista = [...itens];
  if (b.ordem === "maior-area") {
    return lista.sort((x, y) => (y.area ?? -1) - (x.area ?? -1));
  }
  if (b.ordem === "menor-preco" || b.ordem === "maior-preco") {
    const preco = (i: ItemBusca) =>
      precoDaFinalidade(i, b.finalidade).find((v) => v !== null) ?? null;
    const sinal = b.ordem === "menor-preco" ? 1 : -1;
    // Sem preço público ("sob consulta") vai para o fim
    return lista.sort((x, y) => {
      const px = preco(x);
      const py = preco(y);
      if (px === null || py === null) return px === null ? (py === null ? 0 : 1) : -1;
      return (px - py) * sinal;
    });
  }
  return lista.sort((x, y) => y.atualizado - x.atualizado);
}

/**
 * Cidades e bairros para o "Onde?": a lista oficial de Bragança Paulista
 * inteira (mesmo sem imóvel publicado) + os bairros visíveis das outras
 * cidades que têm imóvel.
 */
export function locaisDisponiveis(itens: ItemBusca[]): { cidade: string; bairros: string[] }[] {
  const mapa = new Map<string, Set<string>>([[CIDADE_PRINCIPAL, new Set(NOMES_BAIRROS)]]);
  for (const i of itens) {
    if (!mapa.has(i.cidade)) mapa.set(i.cidade, new Set());
    if (i.bairro) mapa.get(i.cidade)!.add(i.bairro);
  }
  const ordem = (a: string, b: string) => a.localeCompare(b, "pt-BR");
  return [...mapa.entries()]
    .sort(([a], [b]) => ordem(a, b))
    .map(([cidade, bairros]) => ({ cidade, bairros: [...bairros].sort(ordem) }));
}

/**
 * Condomínios para o "Onde?": a lista oficial inteira + os que a equipe
 * cadastrou fora dela. Jardim das Palmeiras ★ sempre primeiro.
 */
export function condominiosDisponiveis(itens: ItemBusca[]): string[] {
  const nomes = new Map<string, string>(NOMES_CONDOMINIOS.map((c) => [semAcento(c), c]));
  for (const i of itens) {
    if (i.condominio && !nomes.has(semAcento(i.condominio))) {
      nomes.set(semAcento(i.condominio), i.condominio);
    }
  }
  return [...nomes.values()].sort(ordemCondominios);
}

/** Rótulo curto de um local escolhido. */
export function rotuloLocal(local: string): string {
  const { cidade, bairro } = separarLocal(local);
  return bairro ?? `Toda ${cidade}`;
}

const N = (n: number, um: string, varios: string) => `${n}+ ${n > 1 ? varios : um}`;

/** Frases curtas do que foi escolhido (chips e mensagem de WhatsApp). */
export function resumoBusca(b: Busca): string[] {
  const partes: string[] = [];
  const fin = FINALIDADES_BUSCA.find((f) => f.value === b.finalidade);
  if (b.finalidade && fin) partes.push(fin.label);
  partes.push(...b.tipos.map((t) => PROPERTY_TYPE_LABELS[t] ?? t));
  partes.push(...b.locais.map(rotuloLocal));
  partes.push(...b.condominios);
  if (b.quartos) partes.push(N(b.quartos, "quarto", "quartos"));
  if (b.suites) partes.push(N(b.suites, "suíte", "suítes"));
  if (b.banheiros) partes.push(N(b.banheiros, "banheiro", "banheiros"));
  if (b.vagas) partes.push(N(b.vagas, "vaga", "vagas"));
  if (b.valorMin && b.valorMax) partes.push(`${formatBRL(b.valorMin)} a ${formatBRL(b.valorMax)}`);
  else if (b.valorMin) partes.push(`a partir de ${formatBRL(b.valorMin)}`);
  else if (b.valorMax) partes.push(`até ${formatBRL(b.valorMax)}`);
  if (b.areaMin && b.areaMax) partes.push(`${formatArea(b.areaMin)} a ${formatArea(b.areaMax)}`);
  else if (b.areaMin) partes.push(`a partir de ${formatArea(b.areaMin)}`);
  else if (b.areaMax) partes.push(`até ${formatArea(b.areaMax)}`);
  partes.push(...b.comodidades.map((c) => AMENITY_BY_KEY[c]?.label ?? c));
  if (b.financiamento) partes.push("Aceita financiamento");
  if (b.fgts) partes.push("Aceita FGTS");
  if (b.pet) partes.push("Aceita pet");
  const mob = MOBILIA_BUSCA.find((m) => m.value === b.mobilia);
  if (mob) partes.push(mob.label);
  if (b.perto.length) {
    const faixa = faixaDe(b.distancia) ?? 0;
    const lugares = b.perto.map((c) => CATEGORIA_POR_VALOR[c].curto).join(", ");
    partes.push(`Perto de ${lugares} (${rotuloFaixa(faixa)})`);
  }
  if (b.texto) partes.push(`“${b.texto}”`);
  return partes;
}
