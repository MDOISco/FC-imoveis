import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-helpers";
import { tituloPublico } from "@/lib/agenda/ics";
import { formatarDataHoraSP } from "@/lib/agenda/slots";
import { APPOINTMENT_STATUSES, labelOf } from "@/lib/constants";
import { db } from "@/lib/db";
import { notificar } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PÚBLICO: dados básicos do agendamento pelo link privado do cliente. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const ap = await db.appointment.findUnique({
    where: { cancelToken: token },
    include: { property: true, broker: true },
  });
  if (!ap) return jsonError("Agendamento não encontrado.", 404);

  return NextResponse.json({
    status: ap.status,
    statusLabel: labelOf(APPOINTMENT_STATUSES, ap.status),
    quando: formatarDataHoraSP(ap.startsAt),
    titulo: tituloPublico(ap.property),
    corretor: ap.broker?.name ?? null,
    podeCancelar: ap.status === "AGENDADO" || ap.status === "CONFIRMADO",
  });
}

/** PÚBLICO: o próprio cliente cancela a visita pelo link privado. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const ap = await db.appointment.findUnique({
    where: { cancelToken: token },
    include: { property: true, broker: true },
  });
  if (!ap) return jsonError("Agendamento não encontrado.", 404);
  if (ap.status === "CANCELADO") return NextResponse.json({ ok: true });
  if (ap.status === "REALIZADO") {
    return jsonError("Essa visita já foi realizada — não dá mais para cancelar.");
  }

  await db.appointment.update({
    where: { id: ap.id },
    data: { status: "CANCELADO" },
  });

  await notificar("agendamento.cancelado", {
    agendamentoId: ap.id,
    origem: "cliente",
    quando: formatarDataHoraSP(ap.startsAt),
    cliente: ap.name,
    whatsapp: ap.phone,
    imovel: ap.property?.refCode ?? null,
    corretor: ap.broker?.name ?? null,
  });

  return NextResponse.json({ ok: true });
}
