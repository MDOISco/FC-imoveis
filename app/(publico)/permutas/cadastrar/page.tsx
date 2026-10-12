import {
  LeadWizard,
  type LeadObjetivo,
} from "@/components/permutas/lead-wizard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Cadastrar meu imóvel" };

// Pré-seleção vinda do link: /permutas/cadastrar?objetivo=vender|alugar|permutar
const OBJETIVO_POR_PARAM: Record<string, LeadObjetivo> = {
  vender: "VENDER",
  alugar: "ALUGAR",
  permutar: "PERMUTAR",
};

export default async function CadastrarPermutaPage({
  searchParams,
}: {
  searchParams: Promise<{ objetivo?: string }>;
}) {
  const { objetivo } = await searchParams;
  const inicial = objetivo
    ? OBJETIVO_POR_PARAM[objetivo.toLowerCase()]
    : undefined;
  return <LeadWizard initialObjetivo={inicial} />;
}
