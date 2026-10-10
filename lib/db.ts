import { PrismaClient } from "@prisma/client";

// Singleton (evita esgotar conexões no hot reload do dev) + pragmas de SQLite
// para suportar escritas concorrentes (uploads paralelos de fotos).

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaPragmasApplied?: boolean;
};

export const db: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (!globalForPrisma.prismaPragmasApplied) {
  globalForPrisma.prismaPragmasApplied = true;
  // Executa uma vez por processo; falha aqui não deve derrubar o app.
  Promise.resolve()
    .then(async () => {
      await db.$queryRawUnsafe("PRAGMA journal_mode=WAL;");
      await db.$queryRawUnsafe("PRAGMA busy_timeout=5000;");
    })
    .catch((err) => {
      console.error("Falha ao aplicar PRAGMAs do SQLite:", err);
    });
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
