import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError, readJson } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Interesse recebido num imóvel da carteira: o corretor ACEITA a permuta em
 * nome do proprietário (cria a curtida recíproca → match → chave dourada
 * abre para o cliente) ou RECUSA.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params; // id do Swipe original (lead → carteira)
  const swipe = await db.swipe.findUnique({
    where: { id },
    include: { toProperty: true, fromProperty: true },
  });
  if (!swipe || !swipe.liked) return jsonError("Interesse não encontrado", 404);
  if (swipe.toProperty.source !== "CORRETOR") {
    return jsonError("Este interesse não é de um imóvel da carteira");
  }

  const body = (await readJson(request)) as { action?: unknown } | null;
  const action = String(body?.action ?? "");
  if (action !== "aceitar" && action !== "recusar") {
    return jsonError("Ação inválida");
  }
  const liked = action === "aceitar";

  await db.swipe.upsert({
    where: {
      fromPropertyId_toPropertyId: {
        fromPropertyId: swipe.toPropertyId,
        toPropertyId: swipe.fromPropertyId,
      },
    },
    update: { liked },
    create: {
      fromPropertyId: swipe.toPropertyId,
      toPropertyId: swipe.fromPropertyId,
      liked,
    },
  });

  if (!liked) return NextResponse.json({ ok: true, match: false });

  const [aId, bId] = [swipe.fromPropertyId, swipe.toPropertyId].sort();
  await db.tradeMatch.upsert({
    where: { propertyAId_propertyBId: { propertyAId: aId, propertyBId: bId } },
    update: {},
    create: { propertyAId: aId, propertyBId: bId },
  });
  return NextResponse.json({ ok: true, match: true });
}
