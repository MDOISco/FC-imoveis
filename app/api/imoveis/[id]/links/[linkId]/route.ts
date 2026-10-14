import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-helpers";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; linkId: string }> };

async function findLink(id: string, linkId: string) {
  const link = await db.privateLink.findUnique({ where: { id: linkId } });
  return link && link.propertyId === id ? link : null;
}

/** Liga/desliga o link (desligar = cliente perde o acesso na hora). */
export async function PATCH(request: Request, { params }: Params) {
  const { id, linkId } = await params;
  const link = await findLink(id, linkId);
  if (!link) return jsonError("Link não encontrado", 404);

  const body = (await readJson(request)) as { active?: unknown } | null;
  if (body?.active === undefined) return jsonError("Nada para salvar");

  await db.privateLink.update({
    where: { id: linkId },
    data: { active: Boolean(body.active) },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id, linkId } = await params;
  const link = await findLink(id, linkId);
  if (!link) return jsonError("Link não encontrado", 404);
  await db.privateLink.delete({ where: { id: linkId } });
  return NextResponse.json({ ok: true });
}
