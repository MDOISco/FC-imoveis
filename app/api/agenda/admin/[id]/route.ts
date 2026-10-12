import { NextResponse } from "next/server";
import { firstZodMessage, jsonError, readJson } from "@/lib/api-helpers";
import { formatarDataHoraSP } from "@/lib/agenda/slots";
import { db } from "@/lib/db";
import { notificar } from "@/lib/notify";
import { agendaAdminAcaoSchema } from "@/lib/validation/agenda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** EQUIPE: confirmar, cancelar ou marcar a visita como realizada. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await readJson(request);
  const parsed = agendaAdminAcaoSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error));

  const ap = await db.appointment.findUnique({
    where: { id },
    include: { property: true, broker: true },
  });
  if (!ap) return jsonError("Agendamento não encontrado.", 404);

  const { acao } = parsed.data;
  const dadosAviso = {
    agendamentoId: ap.id,
    origem: "equipe",
    quando: formatarDataHoraSP(ap.startsAt),
    cliente: ap.name,
    whatsapp: ap.phone,
    imovel: ap.property?.refCode ?? null,
    corretor: ap.broker?.name ?? null,
  };

  if (acao === "confirmar") {
    if (ap.status !== "AGENDADO") {
      return jsonError("Só visitas aguardando confirmação podem ser confirmadas.");
    }
    await db.appointment.update({
      where: { id },
      data: { status: "CONFIRMADO" },
    });
    await notificar("agendamento.confirmado", dadosAviso);
    return NextResponse.json({ ok: true, status: "CONFIRMADO" });
  }

  if (acao === "cancelar") {
    if (ap.status === "REALIZADO") {
      return jsonError("Essa visita já foi realizada — não dá para cancelar.");
    }
    if (ap.status === "CANCELADO") {
      return NextResponse.json({ ok: true, status: "CANCELADO" });
    }
    await db.appointment.update({
      where: { id },
      data: { status: "CANCELADO" },
    });
    await notificar("agendamento.cancelado", dadosAviso);
    return NextResponse.json({ ok: true, status: "CANCELADO" });
  }

  // acao === "realizada"
  if (ap.status === "CANCELADO") {
    return jsonError("Esse agendamento está cancelado.");
  }
  await db.appointment.update({
    where: { id },
    data: { status: "REALIZADO" },
  });
  return NextResponse.json({ ok: true, status: "REALIZADO" });
}
