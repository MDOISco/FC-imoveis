import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError, readJson } from "@/lib/api-helpers";
import { PORTALS } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_PORTALS = new Set(PORTALS.map((p) => p.value));

/** Liga/desliga a publicação por portal (upsert). */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const property = await db.property.findUnique({ where: { id } });
  if (!property) return jsonError("Imóvel não encontrado", 404);
  if (property.source === "LEAD") {
    return jsonError("Imóveis de clientes (permuta) não vão para os portais");
  }

  const body = (await readJson(request)) as { portals?: unknown } | null;
  const portals = Array.isArray(body?.portals) ? body.portals : null;
  if (!portals) return jsonError("Requisição inválida");

  for (const item of portals) {
    const portal = String((item as { portal?: unknown }).portal ?? "");
    const enabled = Boolean((item as { enabled?: unknown }).enabled);
    if (!VALID_PORTALS.has(portal)) {
      return jsonError(`Portal desconhecido: ${portal}`);
    }
    await db.portalPublication.upsert({
      where: { propertyId_portal: { propertyId: id, portal } },
      update: { enabled },
      create: { propertyId: id, portal, enabled },
    });
  }

  const publications = await db.portalPublication.findMany({
    where: { propertyId: id },
  });
  return NextResponse.json({ ok: true, publications });
}
