import { NextResponse } from "next/server";
import { firstZodMessage, jsonError, readJson } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { chatMensagemSchema } from "@/lib/validation/chat";
import { mensagemDTO } from "../../../../_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * EQUIPE: responde uma conversa do bate-papo.
 * Responder uma conversa encerrada reabre a conversa.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const thread = await db.chatThread.findUnique({ where: { id } });
  if (!thread) return jsonError("Conversa não encontrada.", 404);

  const body = await readJson(request);
  const parsed = chatMensagemSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error));

  const [mensagem] = await db.$transaction([
    db.chatMessage.create({
      data: {
        threadId: thread.id,
        from: "EQUIPE",
        text: parsed.data.texto,
        readByTeam: true, // quem escreveu já leu
      },
    }),
    db.chatThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date(), status: "ABERTO" },
    }),
  ]);

  return NextResponse.json(
    { mensagem: mensagemDTO(mensagem), status: "ABERTO" },
    { status: 201 },
  );
}
