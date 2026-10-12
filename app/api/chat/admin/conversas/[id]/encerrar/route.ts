import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-helpers";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * EQUIPE: encerra uma conversa do bate-papo.
 * Se o cliente escrever de novo, a conversa reabre sozinha.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const thread = await db.chatThread.findUnique({ where: { id } });
  if (!thread) return jsonError("Conversa não encontrada.", 404);

  if (thread.status !== "ENCERRADO") {
    await db.chatThread.update({
      where: { id: thread.id },
      data: { status: "ENCERRADO" },
    });
  }

  return NextResponse.json({ ok: true, status: "ENCERRADO" });
}
