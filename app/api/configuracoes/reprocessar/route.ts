import { NextResponse } from "next/server";
import { reprocessAllPhotos } from "@/lib/images/process";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

/** Reaplica o pipeline (marca d'água/tratamento) a TODAS as fotos, a partir dos originais. */
export async function POST() {
  const settings = await getSettings();
  const result = await reprocessAllPhotos(settings);
  return NextResponse.json({ ok: true, ...result });
}
