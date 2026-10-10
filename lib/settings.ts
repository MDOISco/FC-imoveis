import type { Settings } from "@prisma/client";
import { db } from "./db";

/** Lê (ou cria) a linha única de configurações da imobiliária. */
export async function getSettings(): Promise<Settings> {
  const existing = await db.settings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return db.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
}

export function maskApiKey(key: string | null): string | null {
  if (!key) return null;
  if (key.length <= 12) return "••••••••";
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

export function publicBaseUrl(settings: Settings): string {
  return (
    settings.publicBaseUrl?.replace(/\/$/, "") ||
    process.env.APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}
