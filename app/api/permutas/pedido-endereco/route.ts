import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firstZodMessage, jsonError, readJson } from "@/lib/api-helpers";
import { getLeadByToken } from "@/lib/permutas/auth";
import { pedidoEnderecoSchema } from "@/lib/validation/permuta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Pedido de localização exata: o público nunca vê o endereço — deixa o
 * contato e a equipe retorna. Vira uma fila no dashboard.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  const parsed = pedidoEnderecoSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error));

  const property = await db.property.findUnique({
    where: { id: parsed.data.propertyId },
  });
  if (!property || property.status !== "ATIVO") {
    return jsonError("Imóvel não encontrado", 404);
  }

  let leadId: string | null = null;
  if (parsed.data.token) {
    const lead = await getLeadByToken(parsed.data.token);
    leadId = lead?.id ?? null;
  }

  await db.addressRequest.create({
    data: {
      propertyId: property.id,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      leadId,
    },
  });

  return NextResponse.json({ ok: true });
}
