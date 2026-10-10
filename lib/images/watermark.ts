import sharp from "sharp";
import type { Settings } from "@prisma/client";
import { resolveSafe } from "@/lib/storage";

/**
 * Prepara a camada de marca d'água: o logo da imobiliária com a opacidade
 * configurada, ou (sem logo) o nome da agência como texto semitransparente.
 * Retorna null se a marca d'água não puder ser montada.
 */
export async function buildWatermarkOverlay(
  settings: Settings,
  baseWidth: number,
): Promise<Buffer | null> {
  const opacity = Math.min(Math.max(settings.watermarkOpacity ?? 0.45, 0.05), 1);
  const targetWidth = Math.max(Math.round(baseWidth * 0.25), 80);

  if (settings.logoPath) {
    const abs = resolveSafe(settings.logoPath);
    if (abs) {
      try {
        return await sharp(abs)
          .resize({ width: targetWidth, withoutEnlargement: false })
          .ensureAlpha()
          .composite([
            {
              // Multiplica o canal alfa pela opacidade desejada
              input: Buffer.from([255, 255, 255, Math.round(opacity * 255)]),
              raw: { width: 1, height: 1, channels: 4 },
              tile: true,
              blend: "dest-in",
            },
          ])
          .png()
          .toBuffer();
      } catch (err) {
        console.error("Marca d'água: falha ao usar o logo, usando texto.", err);
      }
    }
  }

  // Fallback: texto com o nome da agência (depende de fontes no servidor)
  try {
    const text = (settings.agencyName || "FC Imóveis").slice(0, 40);
    const fontSize = Math.max(Math.round(targetWidth / (text.length * 0.55)), 18);
    const height = Math.round(fontSize * 1.6);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${targetWidth}" height="${height}">
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
        font-family="DejaVu Sans, Arial, sans-serif" font-size="${fontSize}"
        font-weight="bold" fill="#ffffff" fill-opacity="${opacity}"
        stroke="#000000" stroke-opacity="${opacity * 0.5}" stroke-width="1">${text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")}</text>
    </svg>`;
    return await sharp(Buffer.from(svg)).png().toBuffer();
  } catch (err) {
    console.error("Marca d'água: falha no fallback de texto.", err);
    return null;
  }
}

export function watermarkGravity(settings: Settings): string {
  return settings.watermarkPosition === "CENTRO" ? "centre" : "southeast";
}
