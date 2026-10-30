// Localiza, aos poucos e sozinho, os imóveis que ainda não têm ponto no mapa
// (os cadastrados antes desta função e os que ficaram para depois porque o
// serviço de mapas estava fora do ar). Roda ao iniciar o sistema e a cada
// 6 horas — ver instrumentation.ts. Respeita a fila de 1 consulta/segundo.
import { db } from "@/lib/db";
import { atualizarLocalizacao } from "./imovel";

let rodando = false;

export async function preencherLocalizacoes(limite = 200): Promise<void> {
  if (rodando) return;
  rodando = true;
  try {
    const pendentes = await db.property.findMany({
      where: {
        source: "CORRETOR",
        geocodedAt: null,
        OR: [
          { street: { not: null } },
          { neighborhood: { not: null } },
          { condoName: { not: null } },
        ],
      },
      select: { id: true },
      orderBy: { updatedAt: "desc" },
      take: limite,
    });
    for (const { id } of pendentes) {
      // Serviço fora do ar: para e tenta na próxima rodada
      if ((await atualizarLocalizacao(id)) === "falhou") break;
    }
  } catch (err) {
    console.error("Preenchimento das localizações falhou.", err);
  } finally {
    rodando = false;
  }
}

const SEIS_HORAS = 6 * 60 * 60 * 1000;

export function agendarPreenchimento(): void {
  // Evita agendar duas vezes (recarga do servidor em desenvolvimento)
  const g = globalThis as { __fcPreencherGeo?: boolean };
  if (g.__fcPreencherGeo) return;
  g.__fcPreencherGeo = true;
  setTimeout(() => void preencherLocalizacoes(), 30_000).unref?.();
  setInterval(() => void preencherLocalizacoes(), SEIS_HORAS).unref?.();
}
