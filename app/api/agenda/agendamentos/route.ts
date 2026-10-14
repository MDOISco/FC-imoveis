import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { firstZodMessage, jsonError, readJson } from "@/lib/api-helpers";
import { tituloPublico } from "@/lib/agenda/ics";
import {
  AGENDA_CONFIG,
  formatarDataHoraSP,
  listarDias,
} from "@/lib/agenda/slots";
import { db } from "@/lib/db";
import { temAcessoExclusivo } from "@/lib/exclusivo";
import { notificar } from "@/lib/notify";
import { agendamentoSchema } from "@/lib/validation/agenda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PÚBLICO: cria um agendamento de visita (ou atendimento na imobiliária).
 * O horário enviado é validado contra a grade recalculada AGORA no servidor
 * (nunca confiamos só no que veio do navegador).
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  const parsed = agendamentoSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error));

  const { nome, whatsapp, email } = parsed.data;
  const imovelId = parsed.data.imovelId ?? null;

  const inicio = new Date(parsed.data.inicioISO);
  const inicioISO = inicio.toISOString();

  // Imóvel (quando houver): só carteira da imobiliária, e só se o visitante
  // pode mesmo vê-lo (mesma regra de /api/agenda/slots).
  let property: Prisma.PropertyGetPayload<{
    include: { broker: true };
  }> | null = null;
  if (imovelId) {
    property = await db.property.findUnique({
      where: { id: imovelId },
      include: { broker: true },
    });
    if (!property || property.source !== "CORRETOR") {
      return jsonError(
        "Este imóvel não está disponível para visitas no momento.",
        404,
      );
    }
    const visivel =
      property.status === "ATIVO" &&
      (property.publishedOnSite || property.acceptsTrade);
    if (!visivel && !(await temAcessoExclusivo(property.id))) {
      return jsonError(
        "Este imóvel não está disponível para visitas no momento.",
        404,
      );
    }
  }
  const brokerId = property?.brokerId ?? null;

  // Recalcula a grade com os agendamentos atuais e confere o horário pedido.
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
  const slot = dias
    .flatMap((d) => d.slots)
    .find((s) => s.inicioISO === inicioISO);
  if (!slot) {
    return jsonError(
      "Esse horário não está na nossa agenda. Escolha um dos horários da lista.",
    );
  }
  if (!slot.disponivel) {
    return jsonError(
      "Esse horário acabou de ser ocupado. Escolha outro, por favor.",
      409,
    );
  }

  const fim = new Date(inicio.getTime() + AGENDA_CONFIG.duracaoMin * 60000);
  const ap = await db.appointment.create({
    data: {
      propertyId: property?.id ?? null,
      brokerId,
      name: nome,
      phone: whatsapp,
      email: email || null,
      startsAt: inicio,
      endsAt: fim,
    },
  });

  await notificar("agendamento.criado", {
    agendamentoId: ap.id,
    quando: formatarDataHoraSP(inicio),
    cliente: nome,
    whatsapp,
    imovel: property?.refCode ?? null,
    corretor: property?.broker?.name ?? null,
  });

  return NextResponse.json(
    {
      ok: true,
      cancelToken: ap.cancelToken,
      resumo: {
        quando: formatarDataHoraSP(inicio),
        titulo: tituloPublico(property),
        corretor: property?.broker?.name ?? null,
      },
    },
    { status: 201 },
  );
}
