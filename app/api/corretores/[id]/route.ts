import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firstZodMessage, jsonError, readJson } from "@/lib/api-helpers";
import { brokerSchema } from "@/lib/validation/corretor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const existing = await db.broker.findUnique({ where: { id } });
  if (!existing) return jsonError("Corretor não encontrado", 404);

  const body = (await readJson(request)) as Record<string, unknown> | null;
  if (!body) return jsonError("Requisição inválida");

  const data: Record<string, unknown> = {};
  if (typeof body.active === "boolean") data.active = body.active;

  const fields = brokerSchema.partial().safeParse(body);
  if (!fields.success) return jsonError(firstZodMessage(fields.error));
  if (fields.data.name !== undefined) data.name = fields.data.name;
  if (fields.data.phone !== undefined) data.phone = fields.data.phone || null;
  if (fields.data.creci !== undefined) data.creci = fields.data.creci || null;
  if (fields.data.email !== undefined) data.email = fields.data.email || null;

  if (Object.keys(data).length === 0) return jsonError("Nada para salvar");
  const broker = await db.broker.update({ where: { id }, data });
  return NextResponse.json({ ok: true, broker });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await db.broker.findUnique({
    where: { id },
    include: { _count: { select: { properties: true } } },
  });
  if (!existing) return jsonError("Corretor não encontrado", 404);

  if (existing._count.properties > 0) {
    // Tem imóveis vinculados: desativa em vez de excluir (preserva o histórico)
    await db.broker.update({ where: { id }, data: { active: false } });
    return NextResponse.json({
      ok: true,
      deactivated: true,
      message:
        "Este corretor tem imóveis vinculados, então foi desativado (o histórico fica preservado).",
    });
  }
  await db.broker.delete({ where: { id } });
  return NextResponse.json({ ok: true, deactivated: false });
}
