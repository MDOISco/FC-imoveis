import { z } from "zod";

const digits = (s: string) => s.replace(/\D/g, "");

/** Agendamento público de visita/atendimento (página /agendar). */
export const agendamentoSchema = z.object({
  imovelId: z.string().min(5).nullish(),
  inicioISO: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Escolha um horário válido"),
  nome: z.string().trim().min(2, "Informe seu nome").max(120),
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
    .refine((s) => s === "" || /.+@.+\..+/.test(s), "E-mail inválido")
    .optional(),
});

/** Ação da equipe sobre um agendamento (dashboard). */
export const agendaAdminAcaoSchema = z.object({
  acao: z.enum(["confirmar", "cancelar", "realizada"], "Ação inválida"),
});
