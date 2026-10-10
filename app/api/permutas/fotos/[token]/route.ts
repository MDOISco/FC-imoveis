import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/api-helpers";
import { extensionFor, processPhotoFromOriginal } from "@/lib/images/process";
import { getLeadByToken } from "@/lib/permutas/auth";
import { getSettings } from "@/lib/settings";
import { removePath, saveBuffer } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_PHOTOS = 15;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/heic"];

/** Upload de fotos do imóvel do LEAD (identificado pelo link privado). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const lead = await getLeadByToken(token);
  const property = lead?.properties[0];
  if (!lead || !property) return jsonError("Link inválido", 404);

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

  const existing = await db.photo.count({ where: { propertyId: property.id } });
  if (existing + files.length > MAX_PHOTOS) {
    return jsonError(`O limite é de ${MAX_PHOTOS} fotos por imóvel`);
  }

  const settings = await getSettings();
  let position = existing;
  let created = 0;
  const skipped: string[] = [];

  for (const file of files) {
    if (!ACCEPTED.includes(file.type)) {
      skipped.push(`${file.name}: use fotos JPG ou PNG`);
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      skipped.push(`${file.name}: maior que 10MB`);
      continue;
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const photo = await db.photo.create({
      data: {
        propertyId: property.id,
        position,
        isCover: existing === 0 && created === 0,
        watermark: false, // imóvel de cliente não leva a marca da imobiliária
        originalPath: "pendente",
        webPath: "pendente",
        thumbPath: "pendente",
      },
    });
    try {
      const ext = extensionFor(file.type, file.name);
      const originalPath = `properties/${property.id}/photos/${photo.id}/original${ext}`;
      await saveBuffer(originalPath, buffer);
      const processed = await processPhotoFromOriginal(
        property.id,
        photo.id,
        originalPath,
        { rotation: 0, enhance: false, watermark: false },
        settings,
      );
      await db.photo.update({
        where: { id: photo.id },
        data: { originalPath, ...processed },
      });
      created += 1;
      position += 1;
    } catch (err) {
      console.error("Falha ao processar foto do lead:", err);
      await db.photo.delete({ where: { id: photo.id } }).catch(() => {});
      await removePath(`properties/${property.id}/photos/${photo.id}`);
      skipped.push(`${file.name}: não foi possível processar`);
    }
  }

  if (created === 0) {
    return jsonError(skipped[0] ?? "Não foi possível processar as fotos");
  }
  return NextResponse.json({ ok: true, created, skipped });
}
