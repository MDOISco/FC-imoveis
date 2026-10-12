import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError, readJson } from "@/lib/api-helpers";
import { getLeadByToken } from "@/lib/permutas/auth";
import { toPublicProperty } from "@/lib/permutas/public-dto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Registra ✖/🔑 do lead; curtida recíproca cria o match (chave dourada). */
export async function POST(request: Request) {
  const body = (await readJson(request)) as {
    token?: unknown;
    toPropertyId?: unknown;
    liked?: unknown;
  } | null;
  if (!body) return jsonError("Requisição inválida");

  const lead = await getLeadByToken(String(body.token ?? ""));
  const mine = lead?.properties[0];
  if (!lead || !mine) return jsonError("Link inválido", 404);
  // Só participa do deck quem está na permuta e com cadastro válido
  // (em análise ainda pode curtir; reprovado/fora do ar, não).
  if (!mine.acceptsTrade || !["ATIVO", "EM_APROVACAO"].includes(mine.status)) {
    return jsonError(
      "Seu cadastro não está participando das permutas no momento. Fale com a nossa equipe.",
      403,
    );
  }

  const toPropertyId = String(body.toPropertyId ?? "");
  const liked = Boolean(body.liked);

  const target = await db.property.findUnique({
    where: { id: toPropertyId },
    include: {
      photos: { orderBy: { position: "asc" } },
      video: true,
    },
  });
  if (
    !target ||
    target.status !== "ATIVO" ||
    !target.acceptsTrade ||
    target.id === mine.id ||
    target.leadId === lead.id
  ) {
    return jsonError("Este imóvel não está mais disponível para permuta");
  }

  await db.swipe.upsert({
    where: {
      fromPropertyId_toPropertyId: {
        fromPropertyId: mine.id,
        toPropertyId: target.id,
      },
    },
    update: { liked },
    create: { fromPropertyId: mine.id, toPropertyId: target.id, liked },
  });

  if (!liked) return NextResponse.json({ ok: true, match: false });

  // Curtida recíproca? (do imóvel alvo para o meu)
  const reciprocal = await db.swipe.findUnique({
    where: {
      fromPropertyId_toPropertyId: {
        fromPropertyId: target.id,
        toPropertyId: mine.id,
      },
    },
  });
  if (!reciprocal?.liked) {
    return NextResponse.json({ ok: true, match: false });
  }

  const [aId, bId] = [mine.id, target.id].sort();
  const match = await db.tradeMatch.upsert({
    where: { propertyAId_propertyBId: { propertyAId: aId, propertyBId: bId } },
    update: {},
    create: { propertyAId: aId, propertyBId: bId },
  });

  return NextResponse.json({
    ok: true,
    match: true,
    matchId: match.id,
    matchedProperty: toPublicProperty(target),
  });
}
