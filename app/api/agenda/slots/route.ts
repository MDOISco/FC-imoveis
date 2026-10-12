import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-helpers";
import { listarDias } from "@/lib/agenda/slots";
import { db } from "@/lib/db";
import { toPublicProperty } from "@/lib/permutas/public-dto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PÚBLICO: dias e horários disponíveis para agendar.
 * - ?imovel=ID -> grade do corretor responsável pelo imóvel + resuminho público.
 * - sem imóvel -> atendimento na imobiliária (agenda geral, brokerId null).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imovelId = searchParams.get("imovel");

  let brokerId: string | null = null;
  let corretor: string | null = null;
  let imovel: {
    id: string;
    refCode: string;
    typeLabel: string;
    title: string;
    location: string;
    valueLabel: string;
    fotoUrl: string | null;
  } | null = null;

  if (imovelId) {
    const property = await db.property.findUnique({
      where: { id: imovelId },
      include: { photos: { orderBy: { position: "asc" } }, broker: true },
    });
    if (
      !property ||
      property.source !== "CORRETOR" ||
      property.status !== "ATIVO"
    ) {
      return jsonError(
        "Este imóvel não está disponível para visitas no momento.",
        404,
      );
    }
    brokerId = property.brokerId ?? null;
    corretor = property.broker?.name ?? null;
    const pub = toPublicProperty(property);
    imovel = {
      id: pub.id,
      refCode: pub.refCode,
      typeLabel: pub.typeLabel,
      title: pub.title,
      location: pub.location,
      valueLabel: pub.valueLabel,
      fotoUrl: pub.photos[0]?.thumbUrl ?? null,
    };
  }

  const agora = new Date();
  const ocupados = await db.appointment.findMany({
    where: {
      status: { in: ["AGENDADO", "CONFIRMADO"] },
      brokerId,
      endsAt: { gte: agora },
    },
    select: { startsAt: true, endsAt: true, brokerId: true },
  });

  const dias = listarDias(agora, ocupados, brokerId);
  return NextResponse.json({ dias, corretor, imovel });
}
