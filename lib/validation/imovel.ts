import { z } from "zod";
import {
  ADDRESS_VISIBILITY_OPTIONS,
  DOCS_STATUS_OPTIONS,
  FURNISHED_OPTIONS,
  PROPERTY_TYPES,
  PURPOSES,
  SOLAR_POSITIONS,
  purposeIncludesRent,
  purposeIncludesSale,
  purposeIsSeason,
} from "@/lib/constants";
import { bairroPorNome } from "@/lib/cidade/bairros";
import { condominioPorNome } from "@/lib/cidade/condominios";
import { chaveNome } from "@/lib/cidade/nomes";

const values = (opts: { value: string }[]) =>
  opts.map((o) => o.value) as [string, ...string[]];

const optionalTrimmed = z
  .string()
  .trim()
  .max(500, "Texto muito longo")
  .transform((s) => (s === "" ? null : s))
  .nullable()
  .optional();

const optionalInt = z
  .number()
  .int("Use um número inteiro")
  .min(0)
  .max(1_000_000_000, "Valor alto demais")
  .nullable()
  .optional();

const optionalFloat = z
  .number()
  .min(0)
  .max(100_000_000, "Valor alto demais")
  .nullable()
  .optional();

/** Etapa 1 — mínimo para criar o rascunho. */
export const step1Schema = z.object({
  // Lista fechada do BANCO (a opção "PERMUTA" da UI vira VENDA + acceptsTrade
  // antes de chegar aqui; TEMPORADA é legado aceito, sem UI nova).
  purpose: z.enum(["VENDA", "LOCACAO", "VENDA_LOCACAO", "TEMPORADA"], "Escolha a finalidade do anúncio"),
  propertyType: z.enum(values(PROPERTY_TYPES), "Escolha o tipo de imóvel"),
  title: optionalTrimmed,
  brokerId: optionalTrimmed,
  capturedAt: optionalTrimmed, // "AAAA-MM-DD"
  exclusive: z.boolean().optional(),
});

/**
 * Atualização parcial (autosave de qualquer etapa) — lista fechada de campos
 * editáveis pelo wizard. Campos ausentes não são tocados.
 */
export const updateSchema = z
  .object({
    // Etapa 1
    purpose: z.enum(values(PURPOSES)),
    propertyType: z.enum(values(PROPERTY_TYPES)),
    title: optionalTrimmed,
    brokerId: optionalTrimmed,
    capturedAt: optionalTrimmed,
    exclusive: z.boolean(),
    // Etapa 2
    cep: optionalTrimmed,
    street: optionalTrimmed,
    streetNumber: optionalTrimmed,
    complement: optionalTrimmed,
    neighborhood: optionalTrimmed,
    city: z.string().trim().min(1, "Informe a cidade").max(120),
    state: z.string().trim().length(2, "UF com 2 letras").toUpperCase(),
    condoName: optionalTrimmed,
    addressVisibility: z.enum(values(ADDRESS_VISIBILITY_OPTIONS)),
    // Etapa 3
    bedrooms: optionalInt,
    suites: optionalInt,
    bathrooms: optionalInt,
    parkingCovered: optionalInt,
    parkingUncovered: optionalInt,
    usableArea: optionalFloat,
    totalArea: optionalFloat,
    floor: optionalInt,
    totalFloors: optionalInt,
    yearBuilt: z
      .number()
      .int()
      .min(1800, "Ano inválido")
      .max(2100, "Ano inválido")
      .nullable()
      .optional(),
    furnished: z.enum(values(FURNISHED_OPTIONS)).nullable(),
    acceptsPets: z.boolean(),
    solarPosition: z.enum(values(SOLAR_POSITIONS)).nullable(),
    // Etapa 4
    amenities: z.array(z.string().max(60)).max(60),
    // Etapa 5
    salePrice: optionalInt,
    rentPrice: optionalInt,
    seasonDailyPrice: optionalInt,
    condoFee: optionalInt,
    iptuValue: optionalInt,
    iptuPeriod: z.enum(["ANUAL", "MENSAL"]),
    acceptsFinancing: z.boolean(),
    acceptsFgts: z.boolean(),
    acceptsTrade: z.boolean(),
    priceOnRequest: z.boolean(),
    ownerName: optionalTrimmed,
    ownerPhone: optionalTrimmed,
    ownerEmail: optionalTrimmed,
    commissionPct: z.number().min(0).max(100).nullable().optional(),
    docsStatus: z.enum(values(DOCS_STATUS_OPTIONS)).nullable(),
    internalNotes: z
      .string()
      .trim()
      .max(5000)
      .transform((s) => (s === "" ? null : s))
      .nullable()
      .optional(),
    // Etapa 7
    description: z
      .string()
      .trim()
      .max(6000, "Descrição muito longa")
      .transform((s) => (s === "" ? null : s))
      .nullable()
      .optional(),
    descriptionStyle: optionalTrimmed,
  })
  .partial()
  .transform(nomesOficiais);

export type PropertyUpdateInput = z.infer<typeof updateSchema>;

const CIDADE_DA_LISTA = chaveNome("Bragança Paulista");

/**
 * Bairro e condomínio de Bragança Paulista são gravados com o nome da lista
 * oficial ("Jd. Palmeiras" → "Jardim das Palmeiras"), para a busca do site e
 * o mapa acharem o mesmo lugar. Nome fora da lista fica como foi digitado.
 */
function nomesOficiais<
  T extends { city?: string; neighborhood?: string | null; condoName?: string | null },
>(d: T): T {
  // Sem cidade no envio, vale a do cadastro (quase sempre Bragança)
  if (d.city !== undefined && chaveNome(d.city) !== CIDADE_DA_LISTA) return d;
  const r = { ...d };
  if (r.neighborhood) r.neighborhood = bairroPorNome(r.neighborhood)?.nome ?? r.neighborhood;
  if (r.condoName) r.condoName = condominioPorNome(r.condoName)?.nome ?? r.condoName;
  return r;
}

/**
 * Pendências para PUBLICAR (status ATIVO). Lista vazia = pode publicar.
 * Mensagens pensadas para leitura direta pelo corretor.
 */
export function publicationPendencias(p: {
  title?: string | null;
  purpose?: string | null;
  propertyType?: string | null;
  neighborhood?: string | null;
  description?: string | null;
  priceOnRequest?: boolean;
  salePrice?: number | null;
  rentPrice?: number | null;
  seasonDailyPrice?: number | null;
  photosCount: number;
}): string[] {
  const pendencias: string[] = [];
  if (!p.purpose) pendencias.push("Escolha a finalidade (etapa 1)");
  if (!p.propertyType) pendencias.push("Escolha o tipo de imóvel (etapa 1)");
  if (!p.title) pendencias.push("Dê um título ao anúncio (etapa 1)");
  if (!p.neighborhood) pendencias.push("Informe o bairro (etapa 2)");
  if (p.photosCount < 1)
    pendencias.push("Adicione pelo menos 1 foto (etapa 6)");
  if (!p.description)
    pendencias.push("Escolha ou escreva a descrição (etapa 7)");
  if (!p.priceOnRequest) {
    if (purposeIncludesSale(p.purpose) && !p.salePrice)
      pendencias.push("Informe o preço de venda (etapa 5)");
    if (purposeIncludesRent(p.purpose) && !p.rentPrice)
      pendencias.push("Informe o valor da locação (etapa 5)");
    if (purposeIsSeason(p.purpose) && !p.seasonDailyPrice)
      pendencias.push("Informe o valor da diária (etapa 5)");
    if (!p.purpose)
      pendencias.push("Informe os valores (etapa 5)");
  }
  return pendencias;
}
