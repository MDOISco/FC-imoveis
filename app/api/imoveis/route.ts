import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firstZodMessage, jsonError, readJson } from "@/lib/api-helpers";
import { nextRefCode } from "@/lib/refcode";
import { step1Schema } from "@/lib/validation/imovel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const properties = await db.property.findMany({
    where: { source: "CORRETOR" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      refCode: true,
      title: true,
      status: true,
      propertyType: true,
      purpose: true,
      neighborhood: true,
      city: true,
    },
    take: 200,
  });
  return NextResponse.json({ properties });
}

/** Cria o rascunho a partir da etapa 1 do wizard. */
export async function POST(request: Request) {
  const body = await readJson(request);
  const parsed = step1Schema.safeParse(body);
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error));

  const { capturedAt, brokerId, ...rest } = parsed.data;
  const refCode = await nextRefCode();
  const property = await db.property.create({
    data: {
      ...rest,
      brokerId: brokerId || null,
      capturedAt: capturedAt ? new Date(`${capturedAt}T12:00:00`) : null,
      refCode,
      status: "RASCUNHO",
      wizardStep: 1,
      source: "CORRETOR",
    },
  });
  return NextResponse.json({ id: property.id, refCode }, { status: 201 });
}
