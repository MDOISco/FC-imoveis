import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-helpers";
import { icsParaEquipe } from "@/lib/agenda/ics";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** EQUIPE: lembrete de calendário (.ics) com os dados do cliente. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ap = await db.appointment.findUnique({
    where: { id },
    include: { property: true },
  });
  if (!ap) return jsonError("Agendamento não encontrado.", 404);

  const sufixo = ap.property?.refCode ?? "atendimento";
  return new NextResponse(icsParaEquipe(ap, ap.property), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="visita-${sufixo.toLowerCase()}.ics"`,
    },
  });
}
