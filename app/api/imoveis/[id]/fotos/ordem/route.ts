import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError, readJson } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reordena as fotos: recebe a lista completa de ids na nova ordem. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await readJson(request)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids)
    ? body.ids.filter((x): x is string => typeof x === "string")
    : null;
  if (!ids || ids.length === 0) return jsonError("Ordem inválida");

  const photos = await db.photo.findMany({
    where: { propertyId: id },
    select: { id: true },
  });
  const valid = new Set(photos.map((p) => p.id));
  if (ids.length !== valid.size || !ids.every((x) => valid.has(x))) {
    return jsonError("A lista de fotos não confere. Recarregue a página.");
  }

  await db.$transaction(
    ids.map((photoId, index) =>
      db.photo.update({ where: { id: photoId }, data: { position: index } }),
    ),
  );
  return NextResponse.json({ ok: true });
}
