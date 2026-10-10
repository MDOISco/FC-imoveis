import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError, readJson } from "@/lib/api-helpers";
import { generateDescriptions } from "@/lib/descriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Gera as 3 sugestões de descrição (objetiva, emocional, investidor). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const property = await db.property.findUnique({ where: { id } });
  if (!property) return jsonError("Imóvel não encontrado", 404);

  const body = (await readJson(request)) as { regen?: unknown } | null;
  const regen = Number(body?.regen ?? 0) || 0;

  const result = await generateDescriptions(property, regen);
  return NextResponse.json(result);
}
