import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError, readJson } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Aprova (com a descrição escolhida) ou reprova um imóvel de cliente. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const property = await db.property.findUnique({ where: { id } });
  if (!property || property.source !== "LEAD") {
    return jsonError("Cadastro não encontrado", 404);
  }
  if (property.status !== "EM_APROVACAO" && property.status !== "REPROVADO") {
    return jsonError("Este cadastro não está aguardando aprovação");
  }

  const body = (await readJson(request)) as {
    action?: unknown;
    description?: unknown;
    descriptionStyle?: unknown;
    rejectionReason?: unknown;
  } | null;
  const action = String(body?.action ?? "");

  if (action === "aprovar") {
    let description = String(body?.description ?? "").trim();
    if (!description) {
      // Venda/locação (não é permuta): aprova direto com o texto do cliente.
      if (!property.acceptsTrade) {
        description = (property.leadDescription ?? "").trim();
      }
      if (!description) {
        return jsonError("Escolha ou escreva a descrição antes de aprovar");
      }
    }
    await db.property.update({
      where: { id },
      data: {
        status: "ATIVO",
        description: description.slice(0, 6000),
        descriptionStyle: String(body?.descriptionStyle ?? "PROPRIA").slice(0, 20),
        rejectionReason: null,
      },
    });
    return NextResponse.json({ ok: true, status: "ATIVO" });
  }

  if (action === "reprovar") {
    const reason = String(body?.rejectionReason ?? "").trim();
    if (!reason) return jsonError("Escreva o motivo da reprovação");
    await db.property.update({
      where: { id },
      data: { status: "REPROVADO", rejectionReason: reason.slice(0, 1000) },
    });
    return NextResponse.json({ ok: true, status: "REPROVADO" });
  }

  return jsonError("Ação inválida");
}
