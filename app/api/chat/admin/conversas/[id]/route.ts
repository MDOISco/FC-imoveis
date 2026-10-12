import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { filtroDepois, mensagemDTO } from "../../../_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * EQUIPE: mensagens de uma conversa (polling da conversa aberta no painel).
 * `?depois=<id ou data ISO>` devolve só o que é novo. Abrir a conversa marca
 * as mensagens do cliente como lidas pela equipe.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const thread = await db.chatThread.findUnique({ where: { id } });
  if (!thread) return jsonError("Conversa não encontrada.", 404);

  const url = new URL(request.url);
  const filtro = await filtroDepois(thread.id, url.searchParams.get("depois"));
  const mensagens = await db.chatMessage.findMany({
    where: { threadId: thread.id, ...filtro },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 500,
  });

  // A equipe está com a conversa aberta: tudo do cliente vira "lido".
  await db.chatMessage.updateMany({
    where: { threadId: thread.id, from: "CLIENTE", readByTeam: false },
    data: { readByTeam: true },
  });

  return NextResponse.json({
    conversa: {
      id: thread.id,
      nome: thread.name,
      phone: thread.phone,
      status: thread.status,
      lastMessageAt: thread.lastMessageAt.toISOString(),
    },
    mensagens: mensagens.map(mensagemDTO),
  });
}
