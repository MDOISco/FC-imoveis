// Endereço do cadastro → ponto no mapa (uma vez só, guardado no banco).
//
// O OpenStreetMap quase nunca tem o número das casas no Brasil, e a mesma
// avenida pode ter trechos em bairros diferentes (a Av. São Francisco de
// Assis tem pedaços no Taboão e na Vila Santa Libânia, a 4 km um do outro).
// Por isso a rua só vale quando bate com o bairro (ou com o condomínio)
// informado. Do mais preciso ao menos preciso:
//   ENDERECO   rua + número achados no mapa
//   RUA        trecho da rua dentro do bairro/condomínio informado
//   CONDOMINIO portaria/centro do condomínio (lista de lib/cidade)
//   BAIRRO     centro do bairro (aproximado: não vai para o público)
import { condominioPorNome } from "@/lib/cidade/condominios";
import { distanciaM } from "@/lib/cidade/perto";
import { chaveNome, mesmaRua, mesmoBairro, porExtenso } from "@/lib/cidade/nomes";
import {
  buscarNominatim,
  buscarPhoton,
  FalhaGeocodificacao,
  type ResultadoOSM,
} from "./nominatim";

export type Precisao = "ENDERECO" | "RUA" | "CONDOMINIO" | "BAIRRO";
export type Localizacao = { lat: number; lng: number; precisao: Precisao };

export type EnderecoImovel = {
  street: string | null;
  streetNumber: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  condoName: string | null;
};

/** Município de Bragança Paulista (caixa que envolve o limite oficial). */
const CAIXA_BRAGANCA = { latMin: -23.06, latMax: -22.81, lngMin: -46.73, lngMax: -46.39 };

function ehBraganca(cidade: string): boolean {
  return chaveNome(cidade) === chaveNome("Bragança Paulista");
}

function naCidade(r: ResultadoOSM, cidade: string): boolean {
  if (chaveNome(r.cidade) !== chaveNome(cidade)) return false;
  if (!ehBraganca(cidade)) return true;
  const c = CAIXA_BRAGANCA;
  return r.lat >= c.latMin && r.lat <= c.latMax && r.lng >= c.lngMin && r.lng <= c.lngMax;
}

/** Nominatim; se ele não responder, o Photon com o mesmo pedido em texto. */
async function consultar(
  params: Record<string, string>,
  texto: string,
  cidade: string,
): Promise<ResultadoOSM[]> {
  try {
    return await buscarNominatim(params);
  } catch (err) {
    if (!(err instanceof FalhaGeocodificacao)) throw err;
    return buscarPhoton(texto, ehBraganca(cidade) ? CAIXA_BRAGANCA : undefined);
  }
}

function bairroBate(bairro: string | null, r: ResultadoOSM): boolean {
  return Boolean(bairro) && mesmoBairro(bairro as string, r.bairros);
}

/** Centro aproximado do bairro, pelo mapa. */
async function centroDoBairro(
  bairro: string,
  cidade: string,
  uf: string,
): Promise<{ lat: number; lng: number } | null> {
  const texto = `${porExtenso(bairro)}, ${cidade}, ${uf}`;
  const res = await consultar({ q: texto, limit: "5" }, texto, cidade);
  const achado = res.find(
    (r) =>
      ["place", "landuse", "boundary"].includes(r.classe) &&
      naCidade(r, cidade) &&
      mesmoBairro(bairro, r.nome),
  );
  return achado ? { lat: achado.lat, lng: achado.lng } : null;
}

/**
 * Localiza o imóvel. Devolve null quando não dá para saber nem o bairro.
 * Lança FalhaGeocodificacao quando o serviço de mapas não responde (tentar
 * de novo mais tarde).
 */
export async function localizarEndereco(e: EnderecoImovel): Promise<Localizacao | null> {
  const cidade = e.city?.trim() || "Bragança Paulista";
  const uf = e.state?.trim() || "SP";
  const bairro = e.neighborhood?.trim() || null;

  // Condomínio conhecido (às vezes vem no campo do bairro)
  const condo =
    (ehBraganca(cidade) &&
      (condominioPorNome(e.condoName) ?? condominioPorNome(bairro))) ||
    null;
  const pontoCondo =
    condo && condo.lat !== undefined && condo.lng !== undefined
      ? { lat: condo.lat, lng: condo.lng }
      : null;

  const centroBairro = bairro ? await centroDoBairro(bairro, cidade, uf) : null;
  const ancora = pontoCondo ?? centroBairro;

  const rua = e.street?.trim() ? porExtenso(e.street.trim()) : "";
  if (rua) {
    const numero = e.streetNumber?.trim().replace(/\D+$/, "") ?? "";
    const logradouro = numero ? `${numero} ${rua}` : rua;
    const res = await consultar(
      { street: logradouro, city: cidade, state: uf, country: "Brasil", limit: "10" },
      `${rua} ${numero}, ${cidade}`,
      cidade,
    );
    const candidatos = res.filter((r) => naCidade(r, cidade) && mesmaRua(rua, r.rua));
    const pertoDaAncora = (r: ResultadoOSM, max: number) =>
      !ancora || distanciaM(ancora, r) <= max;
    const maisPerto = (lista: ResultadoOSM[]) =>
      ancora
        ? [...lista].sort((a, b) => distanciaM(ancora, a) - distanciaM(ancora, b))[0]
        : lista[0];

    const comNumero = candidatos.filter(
      (r) => numero && r.numero === numero && pertoDaAncora(r, 3000),
    );
    if (comNumero.length) {
      const r = maisPerto(comNumero);
      return { lat: r.lat, lng: r.lng, precisao: "ENDERECO" };
    }
    const noBairro = candidatos.filter((r) => bairroBate(bairro, r));
    if (noBairro.length) {
      const r = maisPerto(noBairro);
      return { lat: r.lat, lng: r.lng, precisao: "RUA" };
    }
    if (ancora) {
      const r = maisPerto(candidatos);
      if (r && distanciaM(ancora, r) <= 1200) {
        return { lat: r.lat, lng: r.lng, precisao: "RUA" };
      }
    } else if (candidatos.length === 1 && !bairro) {
      const r = candidatos[0];
      return { lat: r.lat, lng: r.lng, precisao: "RUA" };
    }
  }

  if (pontoCondo) return { ...pontoCondo, precisao: "CONDOMINIO" };
  if (centroBairro) return { ...centroBairro, precisao: "BAIRRO" };
  return null;
}
