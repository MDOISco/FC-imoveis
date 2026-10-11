import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError, readJson } from "@/lib/api-helpers";
import { removePath } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Gestão dos imóveis de clientes (source=LEAD) depois da fila de aprovação:
 * tirar do ar, publicar de novo ou excluir de vez. Não mexe na carteira.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const property = await db.property.findUnique({ where: { id } });
  if (!property || property.source !== "LEAD") {
    return jsonError("Cadastro não encontrado", 404);
  }

  const body = (await readJson(request)) as { action?: unknown } | null;
  const action = String(body?.action ?? "");

  if (action === "desativar") {
    if (property.status !== "ATIVO") {
      return jsonError("Este cadastro não está no ar");
    }
    await db.property.update({
      where: { id },
      data: { status: "DESATIVADO" },
    });
    return NextResponse.json({ ok: true, status: "DESATIVADO" });
  }

  if (action === "reativar") {
    if (property.status !== "DESATIVADO") {
      return jsonError("Só é possível republicar um cadastro fora do ar");
    }
    // Já foi aprovado pela equipe antes de ser desativado — volta como estava.
    await db.property.update({ where: { id }, data: { status: "ATIVO" } });
    return NextResponse.json({ ok: true, status: "ATIVO" });
  }

  if (action === "excluir") {
    await db.property.delete({ where: { id } });
    await removePath(`properties/${id}`);
    return NextResponse.json({ ok: true });
  }

  return jsonError("Ação inválida");
}
