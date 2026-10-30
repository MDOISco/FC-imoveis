// Comparação de nomes de lugares: "Jd. Palmeiras", "JARDIM DAS PALMEIRAS" e
// "Jardim das Palmeiras" viram a mesma chave. Puro (servidor e navegador).

const ABREVIACOES: Record<string, string> = {
  jd: "jardim",
  jdm: "jardim",
  jardins: "jardim",
  res: "residencial",
  resid: "residencial",
  pq: "parque",
  vl: "vila",
  villa: "vila",
  cond: "condominio",
  conj: "conjunto",
  hab: "habitacional",
  lot: "loteamento",
  chac: "chacara",
  chacaras: "chacara",
  sta: "santa",
  sto: "santo",
  dr: "doutor",
  prof: "professor",
  profa: "professora",
  cel: "coronel",
  david: "davi",
  motta: "mota",
  // logradouros e títulos ("R. Cel. Leme" = "Rua Coronel Leme")
  r: "rua",
  av: "avenida",
  al: "alameda",
  pca: "praca",
  tv: "travessa",
  trav: "travessa",
  rod: "rodovia",
  estr: "estrada",
  mun: "municipal",
  cap: "capitao",
  sen: "senador",
  dep: "deputado",
  pe: "padre",
  exp: "expedicionario",
  eng: "engenheiro",
  maj: "major",
  ver: "vereador",
  jr: "junior",
  sra: "senhora",
};

/** Por extenso, para mandar ao serviço de mapas ("Av." → "Avenida"). */
const POR_EXTENSO: Record<string, string> = {
  r: "Rua",
  av: "Avenida",
  al: "Alameda",
  pca: "Praça",
  "pça": "Praça",
  tv: "Travessa",
  rod: "Rodovia",
  estr: "Estrada",
  jd: "Jardim",
  cel: "Coronel",
  dr: "Doutor",
  prof: "Professor",
  "profª": "Professora",
  cap: "Capitão",
  sen: "Senador",
  dep: "Deputado",
  pe: "Padre",
  maj: "Major",
  ver: "Vereador",
  sta: "Santa",
  sto: "Santo",
};

export function porExtenso(s: string): string {
  return s
    .split(/\s+/)
    .map((p) => POR_EXTENSO[p.replace(/\.$/, "").toLowerCase()] ?? p)
    .join(" ");
}

/** Palavras que não ajudam a distinguir um lugar de outro. */
const VAZIAS = new Set(["de", "da", "do", "das", "dos", "e"]);

export function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Chave de comparação: sem acento, minúscula, abreviações expandidas. */
export function chaveNome(s: string | null | undefined): string {
  if (!s) return "";
  return semAcento(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter((p) => p && !VAZIAS.has(p))
    .map((p) => ABREVIACOES[p] ?? p)
    .join(" ");
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const sa = new Set(a);
  const sb = new Set(b);
  const comuns = [...sa].filter((p) => sb.has(p)).length;
  return comuns / new Set([...sa, ...sb]).size;
}

const TIPOS_RUA = new Set(["rua", "avenida", "alameda", "praca", "travessa", "estrada", "rodovia", "viela", "largo"]);

/** Mesma rua? ("R. Cel. Leme" = "Rua Coronel Leme"; "Rua Leme" ≠ "Rua Coronel Luiz Leme") */
export function mesmaRua(a: string, b: string): boolean {
  const palavras = (s: string) => chaveNome(s).split(" ").filter((p) => p && !TIPOS_RUA.has(p));
  return jaccard(palavras(a), palavras(b)) >= 0.8;
}

// "Jardim", "Vila"… não distinguem um bairro de outro ("Jardim São José" ≠
// "Jardim São Miguel"; "Cidade Planejada I" = "Planejada I").
const GENERICOS_BAIRRO = new Set([
  "jardim", "vila", "parque", "residencial", "cidade", "conjunto", "habitacional",
  "nucleo", "chacara", "bairro", "recanto", "loteamento", "condominio",
]);

/** O bairro informado é um dos bairros que o mapa associa ao ponto? */
export function mesmoBairro(bairro: string, bairrosDoMapa: string): boolean {
  const palavras = (s: string) => {
    const todas = chaveNome(s).split(" ").filter(Boolean);
    const distintas = todas.filter((p) => !GENERICOS_BAIRRO.has(p));
    return distintas.length ? distintas : todas;
  };
  const alvo = palavras(bairro);
  return bairrosDoMapa
    .split("|")
    .some((b) => b.trim() && jaccard(alvo, palavras(b)) >= 0.75);
}

/** Proporção das palavras de `a` que aparecem em `b` (0 a 1). */
export function parecidos(a: string, b: string): number {
  const pa = chaveNome(a).split(" ").filter(Boolean);
  if (pa.length === 0) return 0;
  const pb = new Set(chaveNome(b).split(" "));
  return pa.filter((p) => pb.has(p)).length / pa.length;
}
