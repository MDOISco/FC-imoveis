// Condomínios e loteamentos fechados de Bragança Paulista (relatório de
// out/2026 + planilha do Google Maps da dona). Usada em três lugares:
//   1. cadastro do corretor (sugestões e grafia única do nome);
//   2. busca do site ("Onde?" mostra todos, mesmo sem imóvel publicado);
//   3. mapa "Onde fica cada coisa" (só os que têm coordenada) e como
//      referência para localizar imóveis de condomínio (lib/geo).
// O Jardim das Palmeiras é o principal da imobiliária: sempre primeiro, ★.
import { chaveNome } from "./nomes";

export type Condominio = {
  nome: string;
  tipo: "Horizontal" | "Chácaras" | "Náutico" | "Vertical" | "Comercial";
  local?: string; // referência curta, para o público
  apelidos?: string[]; // outras grafias que significam o MESMO lugar
  lat?: number;
  lng?: number;
  obs?: string;
};

// Condomínio principal da imobiliária (pedido da dona): sempre primeiro, com
// estrela, mesmo antes de ter imóvel publicado lá.
export const CONDOMINIO_DESTAQUE = "Jardim das Palmeiras";

export const CONDOMINIOS: Condominio[] = [
  { nome: "Jardim das Palmeiras", tipo: "Horizontal", local: "Rod. Capitão Barduíno, km 98–99 (sentido Socorro)", apelidos: ["Condomínio Jardim das Palmeiras", "Jd. Palmeiras", "Jardim Palmeiras"], lat: -22.8711843, lng: -46.531821, obs: "Lagos, ginásio, tênis; escola Viverde no condomínio" },
  // ---- Horizontais (casas e lotes) ----
  { nome: "Quinta da Baroneza", tipo: "Horizontal", local: "Rod. Alkindar Monteiro Junqueira (divisa com Itatiba)", apelidos: ["Quinta da Baronesa", "Quinta da Baroneza I", "Quinta da Baroneza II"], lat: -22.9765273, lng: -46.7047282, obs: "Golfe de 18 buracos" },
  { nome: "Fazenda Santa Helena (JHSF)", tipo: "Horizontal", local: "Região de Santa Helena", apelidos: ["Fazenda Santa Helena JHSF"], obs: "Lançamento 2026" },
  { nome: "Residencial Fazenda Santa Helena", tipo: "Horizontal", local: "Santa Helena" },
  { nome: "Fazenda Santa Petronilla", tipo: "Horizontal", apelidos: ["Santa Petronilla"] },
  { nome: "Portal de Bragança", tipo: "Horizontal", local: "Santa Helena", apelidos: ["Residencial Portal de Bragança"], lat: -22.9912906, lng: -46.5250375 },
  { nome: "Portal de Bragança Horizonte", tipo: "Horizontal", local: "Av. Salvador Markowicz – Santa Helena", lat: -22.991953, lng: -46.5177816 },
  { nome: "Village Santa Helena", tipo: "Horizontal", local: "Av. Salvador Markowicz, 650", apelidos: ["Villagio de Santa Helena", "Village de Santa Helena", "Condomínio Village Santa Helena"], lat: -22.9841383, lng: -46.5273818 },
  { nome: "Residencial Santa Helena I", tipo: "Horizontal", local: "Santa Helena" },
  { nome: "Residencial Santa Helena II", tipo: "Horizontal", local: "R. dos Tarumãs – Taboão", lat: -22.9944674, lng: -46.5289541 },
  { nome: "Residencial Santa Helena III", tipo: "Horizontal", local: "R. Abel Benedito de Oliveira – Taboão", lat: -22.9944737, lng: -46.5275775 },
  { nome: "Rosário de Fátima", tipo: "Horizontal", local: "Santa Luzia, em frente ao Colégio Objetivo", lat: -22.9714057, lng: -46.5525472 },
  { nome: "Euroville", tipo: "Horizontal", local: "Jd. São José, ao lado do Euroville Mall", apelidos: ["Euroville I", "Residencial Euroville"], lat: -22.9800404, lng: -46.5463004 },
  { nome: "Euroville II", tipo: "Horizontal", local: "Av. Comunidade Europeia", apelidos: ["Condomínio Residencial Euroville II"], lat: -22.9847789, lng: -46.5430412 },
  { nome: "Vale das Águas", tipo: "Horizontal", local: "Início da Rod. Alkindar, quase em frente ao Garden Shopping", apelidos: ["Condomínio Vale das Águas"], lat: -22.9654976, lng: -46.5624527 },
  { nome: "Colinas de São Francisco", tipo: "Horizontal", local: "Ao lado do Spani, perto do Lago do Taboão", apelidos: ["Residencial Colinas de São Francisco"] },
  { nome: "Terras de Santa Cruz", tipo: "Horizontal", local: "Morro Verde (Rod. Bragança–Itatiba)", apelidos: ["Residencial Terras de Santa Cruz"], lat: -22.9552186, lng: -46.6127532 },
  { nome: "Villa Real de Bragança", tipo: "Horizontal", local: "Jd. América, antes do trevo do Tuiuti", apelidos: ["Villa Real", "Condomínio Villa Real", "Vila Real de Bragança"], lat: -22.9508332, lng: -46.5557417 },
  { nome: "Vereda América", tipo: "Horizontal", local: "R. Dep. Samuel Saúl, 550 – Jd. América", apelidos: ["Society Residencial Vereda América"], lat: -22.9589303, lng: -46.5509204 },
  { nome: "Central Parque Bragança", tipo: "Horizontal", local: "Av. Norte-Sul – Jd. Santa Rita de Cássia", apelidos: ["Residencial Central Parque Bragança", "Central Parque"], lat: -22.9586626, lng: -46.5285829 },
  { nome: "Ile de France", tipo: "Horizontal", local: "R. Arthur Siqueira, 1115 – Jd. São José", apelidos: ["Residence Ile de France", "Condomínio Ile de France"], lat: -22.98019, lng: -46.5393389 },
  { nome: "San Vitale", tipo: "Horizontal", local: "Bom Retiro", apelidos: ["Residencial San Vitale"], lat: -22.9728949, lng: -46.5118824 },
  { nome: "Vale das Emas", tipo: "Horizontal", local: "Estr. Mun. Ismael Leme Mourão – Penha (zona rural)", apelidos: ["Residencial Vale das Emas"], lat: -22.9609432, lng: -46.4978316, obs: "Condomínio novo" },
  { nome: "Campos do Conde", tipo: "Horizontal", local: "Campo Novo", lat: -22.9637615, lng: -46.5793621 },
  { nome: "Jardim Flamboyan", tipo: "Horizontal", apelidos: ["Residencial Jardim Flamboyan"] },
  { nome: "Portal da Serra", tipo: "Horizontal", local: "Alameda das Paineiras – Toró", apelidos: ["Condomínio Portal da Serra"], lat: -22.9468136, lng: -46.5085367 },
  { nome: "Mirante de Bragança", tipo: "Horizontal" },
  { nome: "Sunset Village", tipo: "Horizontal" },
  { nome: "Vila América Resort", tipo: "Horizontal", apelidos: ["Residencial Vila América"] },
  { nome: "Villa Rica", tipo: "Horizontal", apelidos: ["Vila Rica"] },
  { nome: "Berbari", tipo: "Horizontal" },
  { nome: "Berbari II", tipo: "Horizontal" },
  { nome: "Villa Verde", tipo: "Horizontal", apelidos: ["Vila Verde"] },
  { nome: "Residencial Monreale", tipo: "Horizontal" },
  { nome: "Residencial Piemonte", tipo: "Horizontal" },
  { nome: "Residencial Rotterdam", tipo: "Horizontal" },
  { nome: "Residencial Cristaliah", tipo: "Horizontal", local: "Uberaba" },
  { nome: "Residencial Alvorada", tipo: "Horizontal", local: "Vista para o Guaripocaba" },
  { nome: "Residencial Bella Vita", tipo: "Horizontal" },
  { nome: "Villagio Sant'Angelo", tipo: "Horizontal", local: "Centro, acesso pela Av. Norte-Sul" },
  { nome: "Teriva Innovare Residence", tipo: "Horizontal", local: "Av. Anú-Branco – Campo Novo", apelidos: ["Innovare", "Teriva Innovare"], lat: -22.9583632, lng: -46.5844178 },
  { nome: "Imperial Bragança", tipo: "Horizontal", local: "Campinho, a 6 min do shopping" },
  { nome: "Villa Harmonia", tipo: "Horizontal", local: "Bom Retiro" },
  { nome: "Reserva de Bragança", tipo: "Horizontal" },
  { nome: "Curitibanos Eco Residence", tipo: "Horizontal", local: "Curitibanos" },
  { nome: "Parque do Imperador", tipo: "Horizontal" },
  { nome: "Residencial das Ilhas", tipo: "Horizontal", apelidos: ["Ilhas do Caribe"] },
  { nome: "Residencial dos Lagos", tipo: "Horizontal", apelidos: ["Sete Lagos"] },
  { nome: "Residencial Hípica Jaguari", tipo: "Horizontal", local: "Zona norte", apelidos: ["Hípica Jaguari"] },
  { nome: "Floresta de São Vicente", tipo: "Horizontal", apelidos: ["Residencial Floresta São Vicente", "Floresta São Vicente"] },
  { nome: "Aquarela", tipo: "Horizontal" },
  { nome: "Bougain Ville", tipo: "Horizontal" },
  { nome: "Colibri", tipo: "Horizontal" },
  { nome: "Colinas da Mantiqueira", tipo: "Horizontal" },
  { nome: "Jardim Campo Verde", tipo: "Horizontal" },
  { nome: "Jardins de Bragança", tipo: "Horizontal" },
  { nome: "Vila Bocaina", tipo: "Horizontal" },
  { nome: "Vila d'Espanha", tipo: "Horizontal" },
  { nome: "Villa Firenze", tipo: "Horizontal" },
  { nome: "Villa Toscana", tipo: "Horizontal", apelidos: ["Vila Toscana"] },
  { nome: "Vila das Palmeiras", tipo: "Horizontal" },
  { nome: "Parque das Emas", tipo: "Horizontal" },
  { nome: "Vereda Jatobá", tipo: "Horizontal" },
  { nome: "Residencial das Flores", tipo: "Horizontal" },
  { nome: "Morada do Sol", tipo: "Horizontal" },
  { nome: "Vem Viver", tipo: "Horizontal" },
  { nome: "Vino Barolo", tipo: "Horizontal" },
  { nome: "Quinta dos Vinhedos", tipo: "Horizontal" },
  { nome: "Recanto da São Vicente", tipo: "Horizontal" },
  { nome: "Loteamento Navarro", tipo: "Horizontal" },
  { nome: "Condomínio Marcelo Stefani", tipo: "Horizontal" },
  // ---- Chácaras e náuticos (represa) ----
  { nome: "Porto Bragança (Náutico)", tipo: "Náutico", local: "Represa Bragança–Piracaia", apelidos: ["Condomínio Náutico Porto Bragança", "Porto Bragança"] },
  { nome: "Água Azul (Náutico)", tipo: "Náutico", local: "Represa", apelidos: ["Condomínio Náutico Água Azul", "Água Azul"] },
  { nome: "Enseada do Jacareí", tipo: "Náutico", local: "Represa" },
  { nome: "Condomínio Jaguary", tipo: "Chácaras", local: "Represa / Rio Jaguari", apelidos: ["Jaguary", "Condomínio Jaguari"] },
  // ---- Verticais (apartamentos) ----
  { nome: "Orquídea Residence", tipo: "Vertical", local: "R. Dom Aguirre, 889 – Centro", lat: -22.9593099, lng: -46.5429413 },
  { nome: "Edifício New York Trade Center", tipo: "Vertical", local: "R. Cel. João Leme, 460 – Centro", apelidos: ["New York Trade Center"], lat: -22.9549258, lng: -46.5410691 },
  { nome: "Colinas de San Lorenzo", tipo: "Vertical", local: "Jd. São Lourenço", apelidos: ["Colinas de São Lourenzo"] },
  { nome: "Viña de San Lorenzo", tipo: "Vertical", local: "Jd. São Lourenço", apelidos: ["Vina de San Lorenzo"] },
  { nome: "Soleil Residencial Resort", tipo: "Vertical", apelidos: ["Le Soleil", "Residencial Le Soleil"] },
  { nome: "Edifício Dr. Tártari", tipo: "Vertical", apelidos: ["Dr. Tártari"] },
  { nome: "Life by Carraro", tipo: "Vertical" },
  { nome: "Dona Amábilie", tipo: "Vertical" },
  { nome: "Maria José Residencial", tipo: "Vertical" },
  { nome: "Villagio di Roma", tipo: "Vertical", local: "Centro" },
  { nome: "Parque das Cerejeiras", tipo: "Vertical" },
  { nome: "Via del Mare", tipo: "Vertical", local: "Jardim Morumbi" },
  { nome: "Edifício Dom Pedro I", tipo: "Vertical", local: "Av. Dom Pedro I – Taboão" },
  // ---- Comerciais ----
  { nome: "Euroville Office Premium", tipo: "Comercial", local: "Euroville" },
  { nome: "San Domenico", tipo: "Comercial" },
  { nome: "Valle Centro Empresarial", tipo: "Comercial" },
];

/** Palavras genéricas que não mudam o lugar ("Cond. X" = "X"). */
const GENERICAS = new Set(["condominio", "residencial", "residence", "loteamento", "edificio", "nautico"]);

function chaveCondominio(nome: string): string {
  return chaveNome(nome)
    .split(" ")
    .filter((p) => !GENERICAS.has(p))
    .join(" ");
}

const POR_CHAVE = new Map<string, Condominio>();
for (const c of CONDOMINIOS) {
  for (const n of [c.nome, ...(c.apelidos ?? [])]) {
    const k = chaveCondominio(n);
    if (k && !POR_CHAVE.has(k)) POR_CHAVE.set(k, c);
  }
}

/** Condomínio da lista com esse nome (aceita as outras grafias). */
export function condominioPorNome(nome: string | null | undefined): Condominio | null {
  if (!nome?.trim()) return null;
  return POR_CHAVE.get(chaveCondominio(nome)) ?? null;
}

export function ehCondominioDestaque(nome: string): boolean {
  return (
    condominioPorNome(nome)?.nome === CONDOMINIO_DESTAQUE ||
    chaveCondominio(nome).includes(chaveCondominio(CONDOMINIO_DESTAQUE))
  );
}

/** Ordem de exibição: Jardim das Palmeiras primeiro, o resto em A–Z. */
export function ordemCondominios(a: string, b: string): number {
  return (
    Number(ehCondominioDestaque(b)) - Number(ehCondominioDestaque(a)) ||
    a.localeCompare(b, "pt-BR")
  );
}

/** Nomes oficiais, na ordem de exibição. */
export const NOMES_CONDOMINIOS: string[] = CONDOMINIOS.map((c) => c.nome).sort(ordemCondominios);
