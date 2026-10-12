import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** EQUIPE: total de mensagens de clientes ainda não lidas (bolinha da navegação). */
export async function GET() {
  const total = await db.chatMessage.count({
    where: { from: "CLIENTE", readByTeam: false },
  });
  return NextResponse.json({ total });
}
