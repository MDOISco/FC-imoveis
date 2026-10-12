import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-helpers";
import { icsParaCliente } from "@/lib/agenda/ics";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PÚBLICO: lembrete de calendário (.ics) do CLIENTE — só bairro/cidade. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const ap = await db.appointment.findUnique({
    where: { cancelToken: token },
    include: { property: true },
  });
  if (!ap) return jsonError("Agendamento não encontrado.", 404);
  if (ap.status === "CANCELADO") {
    return jsonError("Este agendamento foi cancelado.", 410);
  }

  return new NextResponse(icsParaCliente(ap, ap.property), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="visita-fc-imoveis.ics"',
    },
  });
}
