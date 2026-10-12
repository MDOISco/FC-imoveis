import { NextResponse } from "next/server";
import { firstZodMessage, jsonError, readJson } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { notificar } from "@/lib/notify";
import { chatNovaConversaSchema } from "@/lib/validation/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PÚBLICO: abre uma conversa nova no bate-papo do site.
 * O navegador guarda o clientToken devolvido (localStorage) para continuar.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  const parsed = chatNovaConversaSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error));

  const thread = await db.chatThread.create({
    data: {
      name: parsed.data.nome,
      phone: parsed.data.whatsapp || null,
    },
  });

  await notificar("chat.nova_conversa", {
    conversaId: thread.id,
    nome: thread.name,
  });

  return NextResponse.json(
    { clientToken: thread.clientToken, status: thread.status },
    { status: 201 },
  );
}
