import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError, readJson } from "@/lib/api-helpers";
import { reprocessPhoto } from "@/lib/images/process";
import { getSettings } from "@/lib/settings";
import { removePath } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; fotoId: string }> };

/** Legenda, capa, girar 90°, tratamento e marca d'água (reprocessa do original). */
export async function PATCH(request: Request, { params }: Params) {
  const { id, fotoId } = await params;
  const photo = await db.photo.findUnique({ where: { id: fotoId } });
  if (!photo || photo.propertyId !== id) {
    return jsonError("Foto não encontrada", 404);
  }

  const body = (await readJson(request)) as {
    caption?: unknown;
    isCover?: unknown;
    rotate90?: unknown;
    enhance?: unknown;
    watermark?: unknown;
  } | null;
  if (!body) return jsonError("Requisição inválida");

  const data: Record<string, unknown> = {};
  let needsReprocess = false;

  if (body.caption !== undefined) {
    data.caption = String(body.caption).slice(0, 200) || null;
  }
  if (body.rotate90 === true) {
    data.rotation = (photo.rotation + 90) % 360;
    needsReprocess = true;
  }
  if (body.enhance !== undefined) {
    data.enhance = Boolean(body.enhance);
    needsReprocess = true;
  }
  if (body.watermark !== undefined) {
    data.watermark = Boolean(body.watermark);
    needsReprocess = true;
  }

  if (body.isCover === true) {
    await db.$transaction([
      db.photo.updateMany({
        where: { propertyId: id },
        data: { isCover: false },
      }),
      db.photo.update({ where: { id: fotoId }, data: { isCover: true } }),
    ]);
  }

  if (Object.keys(data).length > 0) {
    await db.photo.update({ where: { id: fotoId }, data });
  }

  if (needsReprocess) {
    const updated = await db.photo.findUnique({ where: { id: fotoId } });
    if (updated) {
      const settings = await getSettings();
      await reprocessPhoto(updated, settings);
    }
  }

  const final = await db.photo.findUnique({ where: { id: fotoId } });
  return NextResponse.json({ ok: true, version: final?.updatedAt.getTime() });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id, fotoId } = await params;
  const photo = await db.photo.findUnique({ where: { id: fotoId } });
  if (!photo || photo.propertyId !== id) {
    return jsonError("Foto não encontrada", 404);
  }
  await db.photo.delete({ where: { id: fotoId } });
  await removePath(`properties/${id}/photos/${fotoId}`);

  // Promove nova capa se a excluída era a capa
  if (photo.isCover) {
    const next = await db.photo.findFirst({
      where: { propertyId: id },
      orderBy: { position: "asc" },
    });
    if (next) {
      await db.photo.update({
        where: { id: next.id },
        data: { isCover: true },
      });
    }
  }
  return NextResponse.json({ ok: true });
}
