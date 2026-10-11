import { AgendarForm } from "@/components/agenda/agendar-form";

export const dynamic = "force-dynamic";

/** Página pública: agendar visita a um imóvel ou atendimento na imobiliária. */
export default async function AgendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const imovel = Array.isArray(params.imovel) ? params.imovel[0] : params.imovel;
  return <AgendarForm imovelId={imovel ?? null} />;
}
