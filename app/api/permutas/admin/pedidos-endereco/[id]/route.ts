import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError, readJson } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Marca um pedido de endereço como contatado (ou reabre). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const existing = await db.addressRequest.findUnique({ where: { id } });
  if (!existing) return jsonError("Pedido não encontrado", 404);

  const body = (await readJson(request)) as { status?: unknown } | null;
  const status = String(body?.status ?? "");
  if (status !== "NOVO" && status !== "CONTATADO") {
    return jsonError("Situação inválida");
  }
  await db.addressRequest.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true });
}
