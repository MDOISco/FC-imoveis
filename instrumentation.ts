// Roda uma vez quando o servidor inicia (Next.js). Agenda a localização
// automática dos imóveis que ainda não estão no mapa (lib/geo/preencher.ts).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { agendarPreenchimento } = await import("@/lib/geo/preencher");
  agendarPreenchimento();
}
