import path from "node:path";
import sharp from "sharp";
import type { Photo, Settings } from "@prisma/client";
import { db } from "@/lib/db";
import { resolveSafe, saveBuffer } from "@/lib/storage";
import { buildWatermarkOverlay, watermarkGravity } from "./watermark";

const WEB_MAX = 1920;
const THUMB_WIDTH = 400;

export type PhotoProcessOptions = {
  rotation: number; // 0 | 90 | 180 | 270 (além do EXIF)
  enhance: boolean;
  watermark: boolean;
};

export type ProcessedPaths = {
  webPath: string;
  thumbPath: string;
  width: number | null;
  height: number | null;
};

/**
 * Gera web.jpg (máx 1920px, q80) e thumb.webp (400px) a partir do ORIGINAL,
 * aplicando rotação EXIF + manual, tratamento automático e marca d'água.
 * O original nunca é alterado — mudar as opções reprocessa do zero.
 */
export async function processPhotoFromOriginal(
  propertyId: string,
  photoId: string,
  originalRelPath: string,
  options: PhotoProcessOptions,
  settings: Settings,
): Promise<ProcessedPaths> {
  const originalAbs = resolveSafe(originalRelPath);
  if (!originalAbs) throw new Error("Original fora do storage");

  let pipeline = sharp(originalAbs, { failOn: "none" }).rotate(); // EXIF
  if (options.rotation % 360 !== 0) {
    pipeline = pipeline.rotate(options.rotation % 360);
  }
  pipeline = pipeline.resize({
    width: WEB_MAX,
    height: WEB_MAX,
    fit: "inside",
    withoutEnlargement: true,
  });
  if (options.enhance) {
    pipeline = pipeline
      .normalize()
      .modulate({ brightness: 1.02, saturation: 1.08 });
  }

  // Materializa a base para conhecer as dimensões antes da marca d'água
  const base = await pipeline.jpeg({ quality: 90 }).toBuffer();
  const meta = await sharp(base).metadata();
  const width = meta.width ?? null;
  const height = meta.height ?? null;

  let withMark = sharp(base);
  if (options.watermark && width) {
    const overlay = await buildWatermarkOverlay(settings, width);
    if (overlay) {
      withMark = withMark.composite([
        {
          input: overlay,
          gravity: watermarkGravity(settings),
        },
      ]);
    }
  }

  const webBuffer = await withMark.jpeg({ quality: 80 }).toBuffer();
  const thumbBuffer = await sharp(webBuffer)
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();

  const dir = `properties/${propertyId}/photos/${photoId}`;
  const webPath = `${dir}/web.jpg`;
  const thumbPath = `${dir}/thumb.webp`;
  await saveBuffer(webPath, webBuffer);
  await saveBuffer(thumbPath, thumbBuffer);

  return { webPath, thumbPath, width, height };
}

/** Reprocessa UMA foto existente a partir do original e atualiza o registro. */
export async function reprocessPhoto(
  photo: Photo,
  settings: Settings,
): Promise<void> {
  const result = await processPhotoFromOriginal(
    photo.propertyId,
    photo.id,
    photo.originalPath,
    {
      rotation: photo.rotation,
      enhance: photo.enhance,
      watermark: photo.watermark,
    },
    settings,
  );
  await db.photo.update({
    where: { id: photo.id },
    data: {
      webPath: result.webPath,
      thumbPath: result.thumbPath,
      width: result.width,
      height: result.height,
    },
  });
}

/** Reprocessa TODAS as fotos (mudança de logo/marca d'água), 2 por vez. */
export async function reprocessAllPhotos(settings: Settings): Promise<{
  total: number;
  failures: number;
}> {
  const photos = await db.photo.findMany();
  let failures = 0;
  const queue = [...photos];
  const workers = Array.from({ length: 2 }, async () => {
    while (queue.length > 0) {
      const photo = queue.shift();
      if (!photo) break;
      try {
        await reprocessPhoto(photo, settings);
      } catch (err) {
        failures += 1;
        console.error(`Falha ao reprocessar foto ${photo.id}:`, err);
      }
    }
  });
  await Promise.all(workers);
  return { total: photos.length, failures };
}

export function extensionFor(mimeType: string, fileName?: string): string {
  const fromName = fileName ? path.extname(fileName).toLowerCase() : "";
  if ([".jpg", ".jpeg", ".png", ".webp", ".heic"].includes(fromName)) {
    return fromName === ".jpeg" ? ".jpg" : fromName;
  }
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  return ".jpg";
}
