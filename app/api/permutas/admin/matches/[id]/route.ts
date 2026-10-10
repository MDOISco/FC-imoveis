import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError, readJson } from "@/lib/api-helpers";
import { MATCH_STATUSES } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID = new Set(MATCH_STATUSES.map((s) => s.value));

/** Workflow do match no dashboard: NOVO → EM_ATENDIMENTO → CONCLUIDO/CANCELADO. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const match = await db.tradeMatch.findUnique({ where: { id } });
  if (!match) return jsonError("Match não encontrado", 404);

  const body = (await readJson(request)) as { status?: unknown } | null;
  const status = String(body?.status ?? "");
  if (!VALID.has(status)) return jsonError("Situação inválida");

  await db.tradeMatch.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true });
}
