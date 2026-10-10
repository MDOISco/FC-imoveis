import { NextResponse } from "next/server";
import sharp from "sharp";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/api-helpers";
import { getSettings } from "@/lib/settings";
import { saveBuffer } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

/** Upload do logo da imobiliária (usado como marca d'água). */
export async function POST(request: Request) {
  await getSettings();
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Envio inválido");
  }
  const file = form.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return jsonError("Escolha o arquivo do logo (PNG com fundo transparente fica melhor)");
  }
  if (file.size > MAX_LOGO_BYTES) {
    return jsonError("O logo passa de 5MB. Use uma imagem menor.");
  }
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    return jsonError("Formato não aceito. Envie PNG, JPG ou WebP.");
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const png = await sharp(buffer, { failOn: "none" })
      .resize({ width: 800, withoutEnlargement: true })
      .png()
      .toBuffer();
    const logoPath = "settings/logo.png";
    await saveBuffer(logoPath, png);
    await db.settings.update({ where: { id: 1 }, data: { logoPath } });
    return NextResponse.json({ ok: true, logoPath });
  } catch (err) {
    console.error("Falha ao processar logo:", err);
    return jsonError("Não foi possível processar essa imagem.", 500);
  }
}
