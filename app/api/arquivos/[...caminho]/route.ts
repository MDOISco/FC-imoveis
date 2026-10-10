import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { contentTypeFor, resolveSafe } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serve os arquivos de storage/ (fotos, vídeos, logo) com cache imutável.
 * Os caminhos levam ?v={updatedAt} como cache-buster quando reprocessados.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ caminho: string[] }> },
) {
  const { caminho } = await params;
  const rel = caminho.join("/");
  const abs = resolveSafe(rel);
  if (!abs) {
    return NextResponse.json({ error: "Caminho inválido" }, { status: 400 });
  }

  let fileStat;
  try {
    fileStat = await stat(abs);
    if (!fileStat.isFile()) throw new Error("not a file");
  } catch {
    return NextResponse.json(
      { error: "Arquivo não encontrado" },
      { status: 404 },
    );
  }

  const headers = new Headers({
    "Content-Type": contentTypeFor(abs),
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
  });

  // Suporte básico a Range (necessário para o player de vídeo buscar posições)
  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (match) {
      const size = fileStat.size;
      let start = match[1] ? parseInt(match[1], 10) : 0;
      let end = match[2] ? parseInt(match[2], 10) : size - 1;
      if (Number.isNaN(start)) start = 0;
      if (Number.isNaN(end) || end >= size) end = size - 1;
      if (start >= size || start > end) {
        headers.set("Content-Range", `bytes */${size}`);
        return new NextResponse(null, { status: 416, headers });
      }
      headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
      headers.set("Content-Length", String(end - start + 1));
      const stream = Readable.toWeb(
        createReadStream(abs, { start, end }),
      ) as ReadableStream;
      return new NextResponse(stream, { status: 206, headers });
    }
  }

  headers.set("Content-Length", String(fileStat.size));
  const stream = Readable.toWeb(createReadStream(abs)) as ReadableStream;
  return new NextResponse(stream, { status: 200, headers });
}
