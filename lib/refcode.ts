import { db } from "./db";

/** Gera o próximo código de referência (FC-0001) de forma atômica. */
export async function nextRefCode(): Promise<string> {
  // Garante a linha de configurações antes do increment atômico.
  await db.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  const updated = await db.settings.update({
    where: { id: 1 },
    data: { nextRefSeq: { increment: 1 } },
  });
  return `FC-${String(updated.nextRefSeq - 1).padStart(4, "0")}`;
}
