import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/api-helpers";
import { removePath, saveWebStream } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB
const ACCEPTED: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/x-m4v": ".m4v",
};

/**
 * Upload do vídeo em stream (corpo bruto do PUT direto para o disco).
 * Nunca usar formData() aqui — 200MB não podem passar pela memória.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const property = await db.property.findUnique({ where: { id } });
  if (!property) return jsonError("Imóvel não encontrado", 404);

  const mimeType = request.headers.get("content-type") ?? "";
  const ext = ACCEPTED[mimeType];
  if (!ext) {
    return jsonError("Formato de vídeo não aceito. Envie um arquivo MP4 ou MOV.");
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (!length) return jsonError("Envio inválido (tamanho desconhecido)");
  if (length > MAX_VIDEO_BYTES) {
    return jsonError(
      "O vídeo passa de 200MB. Diminua a qualidade ou corte o vídeo e tente de novo.",
      413,
    );
  }
  if (!request.body) return jsonError("Envio vazio");

  const url = new URL(request.url);
  const originalName = url.searchParams.get("nome")?.slice(0, 200) || null;

  // Remove vídeo anterior (arquivo + registro)
  const existing = await db.video.findUnique({ where: { propertyId: id } });
  if (existing) {
    await db.video.delete({ where: { propertyId: id } });
    await removePath(`properties/${id}/video`);
  }

  const relPath = `properties/${id}/video/video${ext}`;
  try {
    await saveWebStream(relPath, request.body);
  } catch (err) {
    console.error("Falha ao gravar vídeo:", err);
    await removePath(`properties/${id}/video`);
    return jsonError("Não foi possível salvar o vídeo. Tente novamente.", 500);
  }

  const video = await db.video.create({
    data: {
      propertyId: id,
      path: relPath,
      originalName,
      mimeType,
      sizeBytes: length,
    },
  });
  return NextResponse.json({ ok: true, videoId: video.id, path: relPath });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const existing = await db.video.findUnique({ where: { propertyId: id } });
  if (!existing) return jsonError("Este imóvel não tem vídeo", 404);
  await db.video.delete({ where: { propertyId: id } });
  await removePath(`properties/${id}/video`);
  return NextResponse.json({ ok: true });
}
