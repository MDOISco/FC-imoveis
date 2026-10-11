import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** EQUIPE: lista das conversas do bate-papo (abertas primeiro, mais recentes no topo). */
export async function GET() {
  const threads = await db.chatThread.findMany({
    orderBy: [{ status: "asc" }, { lastMessageAt: "desc" }], // ABERTO < ENCERRADO
    include: {
      messages: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1 },
      _count: {
        select: {
          messages: { where: { from: "CLIENTE", readByTeam: false } },
        },
      },
    },
    take: 200,
  });

  return NextResponse.json({
    conversas: threads.map((t) => ({
      id: t.id,
      nome: t.name,
      phone: t.phone,
      status: t.status,
      lastMessageAt: t.lastMessageAt.toISOString(),
      naoLidas: t._count.messages,
      ultimaPrevia: t.messages[0]?.text.slice(0, 80) ?? null,
    })),
  });
}
