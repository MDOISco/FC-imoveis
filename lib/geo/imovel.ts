// Localização dos imóveis no banco (só servidor). Automática: roda depois de
// salvar o endereço no cadastro e, para os imóveis antigos, aos poucos
// quando o sistema inicia (lib/geo/preencher.ts). Uma vez por endereço:
// a chave (geoKey) diz qual endereço foi usado; mudou o endereço, localiza
// de novo. A posição marcada à mão pela equipe (MANUAL) é respeitada até o
// endereço mudar.
import { db } from "@/lib/db";
import { chaveNome } from "@/lib/cidade/nomes";
import { localizarEndereco } from "./localizar";
import { FalhaGeocodificacao } from "./nominatim";

type ComEndereco = {
  street: string | null;
  streetNumber: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  condoName: string | null;
};

/** Endereço normalizado; vazio quando não há nada para procurar no mapa. */
export function chaveEndereco(p: ComEndereco): string {
  if (!p.street?.trim() && !p.neighborhood?.trim() && !p.condoName?.trim()) {
    return "";
  }
  return [p.street, p.streetNumber, p.neighborhood, p.condoName, p.city, p.state]
    .map((v) => chaveNome(v))
    .join("|");
}

export type ResultadoLocalizacao =
  | "localizado"
  | "nao-achou" // nem o bairro foi encontrado no mapa
  | "sem-endereco"
  | "sem-mudanca"
  | "falhou"; // serviço de mapas fora do ar: tentar depois

export async function atualizarLocalizacao(
  id: string,
  { forcar = false }: { forcar?: boolean } = {},
): Promise<ResultadoLocalizacao> {
  const p = await db.property.findUnique({ where: { id } });
  // Imóvel de cliente (permuta) não vai para o site: não precisa de mapa.
  if (!p || p.source === "LEAD") return "sem-mudanca";

  const chave = chaveEndereco(p);
  if (!forcar && p.geocodedAt && p.geoKey === chave) return "sem-mudanca";

  if (!chave) {
    await db.property.update({
      where: { id },
      data: { latitude: null, longitude: null, geoPrecision: null, geoKey: "", geocodedAt: new Date() },
    });
    return "sem-endereco";
  }

  try {
    const achado = await localizarEndereco(p);
    // O endereço pode ter mudado enquanto o mapa respondia: não sobrescreve.
    const atual = await db.property.findUnique({ where: { id } });
    if (!atual || chaveEndereco(atual) !== chave) return "sem-mudanca";
    await db.property.update({
      where: { id },
      data: {
        latitude: achado?.lat ?? null,
        longitude: achado?.lng ?? null,
        geoPrecision: achado?.precisao ?? null,
        geoKey: chave,
        geocodedAt: new Date(),
      },
    });
    return achado ? "localizado" : "nao-achou";
  } catch (err) {
    if (err instanceof FalhaGeocodificacao) return "falhou";
    console.error("Localização do imóvel falhou.", err);
    return "falhou";
  }
}

/** Equipe marcou o ponto na ficha (vale até o endereço mudar). */
export async function salvarPosicaoManual(
  id: string,
  lat: number,
  lng: number,
): Promise<void> {
  const p = await db.property.findUniqueOrThrow({ where: { id } });
  await db.property.update({
    where: { id },
    data: {
      latitude: lat,
      longitude: lng,
      geoPrecision: "MANUAL",
      geoKey: chaveEndereco(p),
      geocodedAt: new Date(),
    },
  });
}

/** Tira o imóvel do mapa (o site deixa de mostrar o que tem perto). */
export async function removerPosicao(id: string): Promise<void> {
  const p = await db.property.findUniqueOrThrow({ where: { id } });
  await db.property.update({
    where: { id },
    data: {
      latitude: null,
      longitude: null,
      geoPrecision: null,
      geoKey: chaveEndereco(p),
      geocodedAt: new Date(),
    },
  });
}
