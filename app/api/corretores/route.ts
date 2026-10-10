import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firstZodMessage, jsonError, readJson } from "@/lib/api-helpers";
import { brokerSchema } from "@/lib/validation/corretor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const brokers = await db.broker.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: { _count: { select: { properties: true } } },
  });
  return NextResponse.json({ brokers });
}

export async function POST(request: Request) {
  const body = await readJson(request);
  const parsed = brokerSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error));
  const broker = await db.broker.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      creci: parsed.data.creci || null,
      email: parsed.data.email || null,
    },
  });
  return NextResponse.json({ ok: true, broker }, { status: 201 });
}
