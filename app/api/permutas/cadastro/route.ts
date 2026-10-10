import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firstZodMessage, jsonError, readJson } from "@/lib/api-helpers";
import { nextRefCode } from "@/lib/refcode";
import { leadCadastroSchema } from "@/lib/validation/permuta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cadastro público do lead + imóvel dele + o que procura na troca. */
export async function POST(request: Request) {
  const body = await readJson(request);
  const parsed = leadCadastroSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error));

  const { lead, property, preference } = parsed.data;
  const refCode = await nextRefCode();

  const createdLead = await db.lead.create({
    data: {
      name: lead.name,
      whatsapp: lead.whatsapp,
      email: lead.email || null,
    },
  });

  const createdProperty = await db.property.create({
    data: {
      refCode,
      source: "LEAD",
      leadId: createdLead.id,
      status: "EM_APROVACAO",
      purpose: "VENDA",
      acceptsTrade: true,
      addressVisibility: "BAIRRO",
      propertyType: property.propertyType,
      city: property.city,
      neighborhood: property.neighborhood || null,
      cep: property.cep || null,
      bedrooms: property.bedrooms ?? null,
      bathrooms: property.bathrooms ?? null,
      parkingCovered: property.parking ?? null,
      usableArea: property.usableArea ?? null,
      totalArea: property.totalArea ?? null,
      salePrice: property.estimatedValue ?? null,
      leadDescription: property.leadDescription,
      wizardStep: 8,
      tradePreference: {
        create: {
          types: JSON.stringify(preference.types),
          cities: JSON.stringify(["Bragança Paulista"]),
          neighborhoods: JSON.stringify(
            preference.neighborhoods.filter(Boolean),
          ),
          minBedrooms: preference.minBedrooms ?? null,
          minParking: preference.minParking ?? null,
          minUsableArea: preference.minUsableArea ?? null,
          maxValue: preference.maxValue ?? null,
          cashTopUp: preference.cashTopUp,
          notes: preference.notes || null,
        },
      },
    },
  });

  return NextResponse.json(
    {
      ok: true,
      token: createdLead.accessToken,
      propertyId: createdProperty.id,
      refCode,
    },
    { status: 201 },
  );
}
