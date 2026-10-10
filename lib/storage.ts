// Armazenamento local em disco (storage/), fora de public/ porque os arquivos
// são gravados em runtime. Servidos por /api/arquivos/[...caminho].
import { createWriteStream } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export const STORAGE_ROOT = path.join(process.cwd(), "storage");

/** Resolve um caminho relativo DENTRO de storage/; null se tentar escapar. */
export function resolveSafe(relativePath: string): string | null {
  const decoded = decodeURIComponent(relativePath);
  const abs = path.resolve(STORAGE_ROOT, decoded);
  if (abs !== STORAGE_ROOT && !abs.startsWith(STORAGE_ROOT + path.sep)) {
    return null;
  }
  return abs;
}

export async function saveBuffer(
  relativePath: string,
  data: Buffer,
): Promise<string> {
  const abs = resolveSafe(relativePath);
  if (!abs) throw new Error(`Caminho inválido: ${relativePath}`);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, data);
  return abs;
}

/** Grava um ReadableStream (web) direto no disco, sem carregar na memória. */
export async function saveWebStream(
  relativePath: string,
  stream: ReadableStream<Uint8Array>,
): Promise<string> {
  const abs = resolveSafe(relativePath);
  if (!abs) throw new Error(`Caminho inválido: ${relativePath}`);
  await mkdir(path.dirname(abs), { recursive: true });
  const nodeStream = Readable.fromWeb(
    stream as import("node:stream/web").ReadableStream<Uint8Array>,
  );
  await pipeline(nodeStream, createWriteStream(abs));
  return abs;
}

export async function removePath(relativePath: string): Promise<void> {
  const abs = resolveSafe(relativePath);
  if (!abs) return;
  await rm(abs, { recursive: true, force: true });
}

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
};

export function contentTypeFor(filePath: string): string {
  return (
    CONTENT_TYPES[path.extname(filePath).toLowerCase()] ??
    "application/octet-stream"
  );
}
