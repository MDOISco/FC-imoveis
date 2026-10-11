import { NextResponse } from "next/server";
import { firstZodMessage, jsonError, readJson } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { chatMensagemSchema } from "@/lib/validation/chat";
import { mensagemDTO } from "../../../_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PÚBLICO: o cliente envia uma mensagem na própria conversa.
 * Se a conversa estava encerrada, ela reabre sozinha.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const thread = await db.chatThread.findUnique({
    where: { clientToken: token },
  });
  if (!thread) return jsonError("Conversa não encontrada.", 404);

  const body = await readJson(request);
  const parsed = chatMensagemSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error));

  const [mensagem] = await db.$transaction([
    db.chatMessage.create({
      data: {
        threadId: thread.id,
        from: "CLIENTE",
        text: parsed.data.texto,
        readByClient: true, // quem escreveu já leu
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
