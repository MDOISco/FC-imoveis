// Helpers compartilhados pelas rotas do bate-papo (não é uma rota).
import type { ChatMessage, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type MensagemDTO = {
  id: string;
  de: "CLIENTE" | "EQUIPE";
  texto: string;
  criadaEm: string; // ISO (UTC) — o horário é formatado no navegador
};

export function mensagemDTO(m: ChatMessage): MensagemDTO {
  return {
    id: m.id,
    de: m.from === "EQUIPE" ? "EQUIPE" : "CLIENTE",
    texto: m.text,
    criadaEm: m.createdAt.toISOString(),
  };
}

/**
 * Filtro "só o que chegou depois de X" para o polling ficar leve.
 * X pode ser o id da última mensagem que o navegador já tem OU uma data ISO.
 */
export async function filtroDepois(
  threadId: string,
  depois: string | null,
): Promise<Prisma.ChatMessageWhereInput> {
  if (!depois) return {};
  // Datas ISO começam com dígito ("2026-10-11T..."); ids (cuid) começam com letra.
  if (/^\d/.test(depois)) {
    const data = new Date(depois);
    return Number.isNaN(data.getTime()) ? {} : { createdAt: { gt: data } };
  }
  const ref = await db.chatMessage.findUnique({ where: { id: depois } });
  if (!ref || ref.threadId !== threadId) return {};
  return {
    OR: [
      { createdAt: { gt: ref.createdAt } },
      // desempate para mensagens criadas no mesmo milissegundo
      { createdAt: ref.createdAt, id: { gt: ref.id } },
    ],
  };
}
