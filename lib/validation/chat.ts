import { z } from "zod";

const digits = (s: string) => s.replace(/\D/g, "");

/** Início de conversa pelo widget público do site (botão flutuante). */
export const chatNovaConversaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Escreva seu nome para começarmos")
    .max(120, "Nome muito longo"),
  whatsapp: z
    .string()
    .trim()
    .max(20, "WhatsApp muito longo")
    .refine(
      (s) => s === "" || (digits(s).length >= 10 && digits(s).length <= 11),
      "Informe um WhatsApp válido com DDD (ou deixe em branco)",
    )
    .optional(),
});

/** Mensagem enviada no bate-papo (vale para cliente e para a equipe). */
export const chatMensagemSchema = z.object({
  texto: z
    .string()
    .trim()
    .min(1, "Escreva uma mensagem antes de enviar")
    .max(2000, "Mensagem muito longa (máximo de 2000 caracteres)"),
});
