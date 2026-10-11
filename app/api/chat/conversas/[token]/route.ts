import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { filtroDepois, mensagemDTO } from "../../_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PÚBLICO: mensagens da conversa do cliente (polling do widget).
 * - `?depois=<id da última mensagem ou data ISO>` devolve só o que é novo.
 * - As mensagens da EQUIPE devolvidas são marcadas como lidas pelo cliente.
 * - `?espiar=1` é o modo leve do botão fechado: devolve só o status e a
 *   contagem de não lidas, SEM marcar nada como lido (senão a bolinha
 *   apagaria antes de a pessoa abrir o painel).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const thread = await db.chatThread.findUnique({
    where: { clientToken: token },
  });
  if (!thread) return jsonError("Conversa não encontrada.", 404);

  const url = new URL(request.url);

  if (url.searchParams.get("espiar")) {
    const naoLidas = await db.chatMessage.count({
      where: { threadId: thread.id, from: "EQUIPE", readByClient: false },
    });
    return NextResponse.json({ status: thread.status, naoLidas });
  }

  const filtro = await filtroDepois(thread.id, url.searchParams.get("depois"));
  const mensagens = await db.chatMessage.findMany({
    where: { threadId: thread.id, ...filtro },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 500,
  });

  const idsEquipe = mensagens
    .filter((m) => m.from === "EQUIPE" && !m.readByClient)
    .map((m) => m.id);
  if (idsEquipe.length > 0) {
    await db.chatMessage.updateMany({
      where: { id: { in: idsEquipe } },
      data: { readByClient: true },
    });
  }

  return NextResponse.json({
    status: thread.status,
    mensagens: mensagens.map(mensagemDTO),
  });
}
