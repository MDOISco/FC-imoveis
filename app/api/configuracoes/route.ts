import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { firstZodMessage, jsonError, readJson } from "@/lib/api-helpers";
import { getSettings, maskApiKey } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z
  .object({
    agencyName: z.string().trim().min(1, "Informe o nome da imobiliária").max(120),
    creci: z.string().trim().max(40).nullable(),
    phone: z.string().trim().max(30).nullable(),
    whatsapp: z.string().trim().max(30).nullable(),
    email: z.string().trim().max(160).nullable(),
    publicBaseUrl: z
      .string()
      .trim()
      .max(300)
      .refine(
        (s) => s === "" || /^https?:\/\//.test(s),
        "O endereço deve começar com http:// ou https://",
      )
      .nullable(),
    watermarkDefault: z.boolean(),
    watermarkPosition: z.enum(["CANTO", "CENTRO"]),
    watermarkOpacity: z.number().min(0.05).max(1),
    anthropicApiKey: z.string().trim().max(300).nullable(),
  })
  .partial();

export async function GET() {
  const s = await getSettings();
  return NextResponse.json({
    settings: {
      agencyName: s.agencyName,
      creci: s.creci,
      phone: s.phone,
      whatsapp: s.whatsapp,
      email: s.email,
      publicBaseUrl: s.publicBaseUrl,
      logoPath: s.logoPath,
      watermarkDefault: s.watermarkDefault,
      watermarkPosition: s.watermarkPosition,
      watermarkOpacity: s.watermarkOpacity,
      anthropicApiKeyMasked: maskApiKey(s.anthropicApiKey),
    },
  });
}

export async function PATCH(request: Request) {
  await getSettings();
  const body = await readJson(request);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error));

  const data: Record<string, unknown> = { ...parsed.data };
  // Chave da API: string vazia ou null limpa; ausente mantém a atual.
  if ("anthropicApiKey" in parsed.data) {
    data.anthropicApiKey = parsed.data.anthropicApiKey || null;
  }
  if ("publicBaseUrl" in parsed.data) {
    data.publicBaseUrl = parsed.data.publicBaseUrl || null;
  }

  const updated = await db.settings.update({ where: { id: 1 }, data });
  return NextResponse.json({
    ok: true,
    anthropicApiKeyMasked: maskApiKey(updated.anthropicApiKey),
  });
}
