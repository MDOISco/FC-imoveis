import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError, readJson } from "@/lib/api-helpers";
import { getLeadByToken } from "@/lib/permutas/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Marca os matches do lead como vistos (a chave dourada anima uma vez). */
export async function POST(request: Request) {
  const body = (await readJson(request)) as { token?: unknown } | null;
  const lead = await getLeadByToken(String(body?.token ?? ""));
  const mine = lead?.properties[0];
  if (!lead || !mine) return jsonError("Link inválido", 404);

  await db.tradeMatch.updateMany({
    where: { propertyAId: mine.id, seenByA: false },
    data: { seenByA: true },
  });
  await db.tradeMatch.updateMany({
    where: { propertyBId: mine.id, seenByB: false },
    data: { seenByB: true },
  });

  return NextResponse.json({ ok: true });
}
