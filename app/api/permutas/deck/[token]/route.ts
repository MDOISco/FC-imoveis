import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/api-helpers";
import { getLeadByToken } from "@/lib/permutas/auth";
import { twoWayScore } from "@/lib/permutas/matching";
import { toPublicProperty } from "@/lib/permutas/public-dto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Deck do lead: candidatos à permuta ordenados pelo cruzamento de dados. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const lead = await getLeadByToken(token);
  const mine = lead?.properties[0];
  if (!lead || !mine) return jsonError("Link inválido", 404);
  if (!mine.acceptsTrade || !["ATIVO", "EM_APROVACAO"].includes(mine.status)) {
    return jsonError(
      "Seu cadastro não está participando das permutas no momento. Fale com a nossa equipe.",
      403,
    );
  }

  const swiped = await db.swipe.findMany({
    where: { fromPropertyId: mine.id },
    select: { toPropertyId: true },
  });
  const swipedIds = swiped.map((s) => s.toPropertyId);

  const candidates = await db.property.findMany({
    where: {
      status: "ATIVO",
      acceptsTrade: true,
      id: { notIn: [...swipedIds, mine.id] },
      // Não mostrar outros imóveis do próprio lead (leadId null = da carteira)
      OR: [{ leadId: null }, { leadId: { not: lead.id } }],
    },
    include: {
      photos: { orderBy: { position: "asc" } },
      video: true,
      tradePreference: true,
    },
    take: 200,
  });

  const scored = candidates
    .map((c) => ({ property: c, score: twoWayScore(mine, c) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return NextResponse.json({
    cards: scored.map((s) => toPublicProperty(s.property)),
  });
}
