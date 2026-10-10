import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/api-helpers";
import { extensionFor, processPhotoFromOriginal } from "@/lib/images/process";
import { getSettings } from "@/lib/settings";
import { removePath, saveBuffer } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_FILES_PER_REQUEST = 30;
const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB por foto
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/heic"];

/** Upload múltiplo de fotos (multipart). Processa uma a uma com sharp. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const property = await db.property.findUnique({
    where: { id },
    include: { _count: { select: { photos: true } } },
  });
  if (!property) return jsonError("Imóvel não encontrado", 404);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Envio inválido. Tente novamente.");
  }

  const files = form
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return jsonError("Nenhuma foto recebida");
  if (files.length > MAX_FILES_PER_REQUEST) {
    return jsonError(`Envie no máximo ${MAX_FILES_PER_REQUEST} fotos por vez`);
  }

  const settings = await getSettings();
  const existing = await db.photo.count({ where: { propertyId: id } });
  let position = existing;
  const created: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    if (!ACCEPTED.includes(file.type)) {
      skipped.push(`${file.name}: formato não aceito (use JPG ou PNG)`);
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      skipped.push(`${file.name}: maior que 15MB`);
      continue;
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const photo = await db.photo.create({
      data: {
        propertyId: id,
        position: position,
        isCover: existing === 0 && created.length === 0,
        watermark: settings.watermarkDefault,
        enhance: false,
        originalPath: "pendente",
        webPath: "pendente",
        thumbPath: "pendente",
      },
    });
    try {
      const ext = extensionFor(file.type, file.name);
      const originalPath = `properties/${id}/photos/${photo.id}/original${ext}`;
      await saveBuffer(originalPath, buffer);
      const processed = await processPhotoFromOriginal(
        id,
        photo.id,
        originalPath,
        {
          rotation: 0,
          enhance: false,
          watermark: settings.watermarkDefault,
        },
        settings,
      );
      await db.photo.update({
        where: { id: photo.id },
        data: { originalPath, ...processed },
      });
      created.push(photo.id);
      position += 1;
    } catch (err) {
      console.error("Falha ao processar foto:", err);
      await db.photo.delete({ where: { id: photo.id } }).catch(() => {});
      await removePath(`properties/${id}/photos/${photo.id}`);
      skipped.push(`${file.name}: não foi possível processar`);
    }
  }

  if (created.length === 0) {
    return jsonError(
      skipped[0] ?? "Não foi possível processar as fotos enviadas",
    );
  }
  return NextResponse.json({ ok: true, created: created.length, skipped });
}
