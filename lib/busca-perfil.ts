// Busca PERSONALIZADA do site: em vez de filtros técnicos, o cliente conta
// COMO MORA (sozinho, casal, filhos, pets, carros, trabalha em casa…) por um
// checklist ou escrevendo livremente, e a gente traduz isso para a busca
// comum (lib/busca-site.ts). Funções puras, sem IA: rodam no navegador e o
// resultado é a mesma URL /?quartos=…&vagas=…&pet=1 da busca convencional.
import { BUSCA_VAZIA, type Busca } from "@/lib/busca-site";
import { AMENITY_BY_KEY, PROPERTY_TYPES } from "@/lib/constants";

export type Moradores = "" | "SOZINHO" | "CASAL" | "GRUPO";

export type Perfil = {
  moradores: Moradores;
  filhos: number; // 0 a 4
  pets: boolean;
  carros: number; // 0 a 4
  homeOffice: boolean;
  // Extras que o texto livre pode trazer
  finalidade: "" | "comprar" | "alugar";
  tipos: string[];
  comodidades: string[];
};

export const PERFIL_VAZIO: Perfil = {
  moradores: "",
  filhos: 0,
  pets: false,
  carros: 0,
  homeOffice: false,
  finalidade: "",
  tipos: [],
  comodidades: [],
};

export const OPCOES_MORADORES: { value: Moradores; label: string; emoji: string }[] = [
  { value: "SOZINHO", label: "Só eu", emoji: "🙋" },
  { value: "CASAL", label: "Um casal", emoji: "💑" },
  { value: "GRUPO", label: "Mais pessoas", emoji: "👨‍👩‍👧" },
];

export function perfilPreenchido(p: Perfil): boolean {
  return (
    p.moradores !== "" ||
    p.filhos > 0 ||
    p.pets ||
    p.carros > 0 ||
    p.homeOffice ||
    p.finalidade !== "" ||
    p.tipos.length > 0 ||
    p.comodidades.length > 0
  );
}

/**
 * Quantos quartos o perfil pede (mínimo, como na busca comum):
 * 1 para quem mora (casal divide o quarto; "mais pessoas" começa com 2),
 * +1 por filho e +1 para o home office. Teto de 4 ("4+" na busca).
 */
export function quartosSugeridos(p: Perfil): number {
  const base =
    p.moradores === "GRUPO" ? 2 : p.moradores !== "" || p.filhos > 0 || p.homeOffice ? 1 : 0;
  if (base === 0) return 0;
  return Math.min(4, base + p.filhos + (p.homeOffice ? 1 : 0));
}

/** Traduz o perfil para os filtros da busca comum. */
export function perfilParaBusca(p: Perfil): Busca {
  return {
    ...BUSCA_VAZIA,
    finalidade: p.finalidade,
    tipos: p.tipos,
    quartos: quartosSugeridos(p),
    vagas: Math.min(4, Math.max(0, p.carros)),
    pet: p.pets,
    comodidades: p.comodidades,
  };
}

const NUMEROS: Record<string, number> = {
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
};

function numero(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  if (Number.isFinite(n)) return n;
  return NUMEROS[s] ?? null;
}

function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const TIPOS_VALIDOS = new Set(PROPERTY_TYPES.map((t) => t.value));

function tiposValidos(tipos: string[]): string[] {
  return [...new Set(tipos)].filter((t) => TIPOS_VALIDOS.has(t));
}

function comodidadesValidas(chaves: string[]): string[] {
  return [...new Set(chaves)].filter((c) => AMENITY_BY_KEY[c]);
}

/**
 * Lê um texto livre do cliente ("somos um casal com 2 filhos e um cachorro,
 * temos 2 carros e trabalho em casa") e devolve só o que foi entendido.
 * Regras simples de pt-BR, sem IA — mesmo resultado no celular e no servidor.
 */
export function lerTexto(texto: string): Partial<Perfil> {
  const t = ` ${semAcento(texto)} `;
  const p: Partial<Perfil> = {};

  // Home office primeiro: tira "trabalho em casa" do texto para a palavra
  // "casa" não virar tipo de imóvel sem querer.
  let resto = t;
  if (
    /home ?office|trabalh\w* (de|em) casa|atend\w* em casa|consultorio|escritorio em casa/.test(t)
  ) {
    p.homeOffice = true;
    resto = t.replace(/home ?office|trabalh\w* (de|em) casa|atend\w* em casa/g, " ");
  }

  // Quem vai morar
  if (/casal|casad\w*|marido|esposa|esposo|noiv\w*|namorad\w*|nos dois|minha mulher|familia/.test(t)) {
    p.moradores = "CASAL";
  }
  if (/sozinh\w*|solteir\w*|so eu|moro so|so para mim/.test(t)) {
    p.moradores = "SOZINHO";
  }
  if (/amigos|republica|dividir com|irmaos|colegas/.test(t)) {
    p.moradores = "GRUPO";
  }

  // Filhos / crianças
  if (/sem filhos|nao tem\w* filhos|nenhum filho|nenhuma crianca/.test(t)) {
    p.filhos = 0;
  } else {
    const comNumero = t.match(
      /(\d+|um|uma|dois|duas|tres|quatro|cinco|seis)\s+(?:filh|crianc|menin|beb[e]|adolescent)/,
    );
    const n = numero(comNumero?.[1]);
    if (n !== null) p.filhos = Math.min(4, n);
    else if (/filhos|criancas|meninos|meninas|gemeos/.test(t)) p.filhos = 2;
    else if (/filho|filha|crianca|bebe|menino|menina/.test(t)) p.filhos = 1;
  }

  // Pets
  if (/sem (pet|cachorro|gato|animal|bicho)|nao tem\w* (pet|cachorro|gato|animal|bicho)/.test(t)) {
    p.pets = false;
  } else if (/cachorr\w*|gat[oa]s?\b|\bpets?\b|animal de estimacao|animais|bichos?\b|\bdog\b|caes\b|\bcao\b/.test(t)) {
    p.pets = true;
  }

  // Carros / vagas
  if (/sem carro|nao tem\w* carro|nao dirig/.test(t)) {
    p.carros = 0;
  } else {
    const comNumero = t.match(/(\d+|um|uma|dois|duas|tres|quatro)\s+(?:carro|moto|veiculo)/);
    const n = numero(comNumero?.[1]);
    if (n !== null) p.carros = Math.min(4, n);
    else if (/carros|motos|veiculos/.test(t)) p.carros = 2;
    else if (/carro|moto\b|veiculo/.test(t)) p.carros = 1;
  }

  // Comprar ou alugar
  if (/alug/.test(t)) p.finalidade = "alugar";
  else if (/compr|financi|a venda|adquirir/.test(t)) p.finalidade = "comprar";

  // Tipo de imóvel (no texto SEM as frases de home office)
  const tipos: string[] = [];
  if (/apartament|apto|\bape\b/.test(resto)) tipos.push("APARTAMENTO");
  if (/sobrado/.test(resto)) tipos.push("SOBRADO");
  if (/chacara/.test(resto)) tipos.push("CHACARA");
  if (/sitio/.test(resto)) tipos.push("SITIO");
  if (/fazenda/.test(resto)) tipos.push("FAZENDA");
  if (/terreno|\blote\b/.test(resto)) tipos.push("TERRENO");
  if (/kitnet|kitinete|studio|estudio/.test(resto)) tipos.push("KITNET");
  if (/\bcasas?\b/.test(resto)) tipos.push("CASA", "CASA_CONDOMINIO", "SOBRADO");
  if (tipos.length) p.tipos = tiposValidos(tipos);

  // Desejos que viram comodidade
  const desejos: string[] = [];
  if (/piscina/.test(t)) desejos.push("piscina");
  if (/churrasqueira/.test(t)) desejos.push("churrasqueira");
  if (/quintal/.test(t)) desejos.push("quintal");
  if (/varanda|sacada/.test(t)) desejos.push("varanda");
  if (/jardim/.test(t)) desejos.push("jardim");
  if (/academia/.test(t)) desejos.push("academia");
  if (/elevador/.test(t)) desejos.push("elevador");
  if (/condominio fechado/.test(t)) desejos.push("condominio-fechado");
  if (/portaria/.test(t)) desejos.push("portaria-24h");
  if (/area gourmet/.test(t)) desejos.push("area-gourmet");
  if (desejos.length) p.comodidades = comodidadesValidas(desejos);

  return p;
}

/** Frases curtas do que o perfil diz (chips de "entendemos assim"). */
export function resumoPerfil(p: Perfil): string[] {
  const partes: string[] = [];
  const m = OPCOES_MORADORES.find((o) => o.value === p.moradores);
  if (m) partes.push(m.label);
  if (p.filhos) partes.push(p.filhos === 1 ? "1 filho(a)" : `${p.filhos} filhos`);
  if (p.pets) partes.push("Tem pet 🐾");
  if (p.carros) partes.push(p.carros === 1 ? "1 carro" : `${p.carros} carros`);
  if (p.homeOffice) partes.push("Trabalha em casa");
  if (p.finalidade === "alugar") partes.push("Quer alugar");
  if (p.finalidade === "comprar") partes.push("Quer comprar");
  return partes;
}
