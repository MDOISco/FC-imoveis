import { z } from "zod";
import { CASH_TOPUP_OPTIONS, PROPERTY_TYPES } from "@/lib/constants";

const typeValues = PROPERTY_TYPES.map((o) => o.value) as [string, ...string[]];
const cashValues = CASH_TOPUP_OPTIONS.map((o) => o.value) as [
  string,
  ...string[],
];

const digits = (s: string) => s.replace(/\D/g, "");

export const leadCadastroSchema = z.object({
  lead: z.object({
    name: z.string().trim().min(2, "Informe seu nome").max(120),
    whatsapp: z
      .string()
      .trim()
      .refine(
        (s) => digits(s).length >= 10 && digits(s).length <= 11,
        "Informe um WhatsApp válido com DDD",
      ),
    email: z
      .string()
      .trim()
      .max(160)
      .refine(
        (s) => s === "" || /.+@.+\..+/.test(s),
        "E-mail inválido",
      )
      .optional(),
  }),
  property: z.object({
    propertyType: z.enum(typeValues, "Escolha o tipo do seu imóvel"),
    city: z.string().trim().min(1, "Informe a cidade").max(120),
    neighborhood: z.string().trim().max(120).optional(),
    cep: z.string().trim().max(10).optional(),
    bedrooms: z.number().int().min(0).max(50).nullable().optional(),
    bathrooms: z.number().int().min(0).max(50).nullable().optional(),
    parking: z.number().int().min(0).max(50).nullable().optional(),
    usableArea: z.number().min(0).max(10_000_000).nullable().optional(),
    totalArea: z.number().min(0).max(10_000_000).nullable().optional(),
    estimatedValue: z
      .number()
      .int()
      .min(0)
      .max(1_000_000_000)
      .nullable()
      .optional(),
    leadDescription: z
      .string()
      .trim()
      .min(10, "Conte um pouco sobre o seu imóvel (pelo menos uma frase)")
      .max(4000, "Descrição muito longa"),
  }),
  preference: z.object({
    types: z.array(z.string().max(40)).max(16),
    neighborhoods: z.array(z.string().trim().max(120)).max(20),
    minBedrooms: z.number().int().min(0).max(50).nullable().optional(),
    minParking: z.number().int().min(0).max(50).nullable().optional(),
    minUsableArea: z.number().min(0).max(10_000_000).nullable().optional(),
    maxValue: z
      .number()
      .int()
      .min(0)
      .max(1_000_000_000)
      .nullable()
      .optional(),
    cashTopUp: z.enum(cashValues),
    notes: z.string().trim().max(1000).optional(),
  }),
});

export const pedidoEnderecoSchema = z.object({
  propertyId: z.string().min(5),
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z
    .string()
    .trim()
    .min(5, "Informe seu e-mail")
    .max(160)
    .refine((s) => /.+@.+\..+/.test(s), "E-mail inválido"),
  phone: z
    .string()
    .trim()
    .refine(
      (s) => digits(s).length >= 10 && digits(s).length <= 11,
      "Informe um celular válido com DDD",
    ),
  token: z.string().optional(),
});
