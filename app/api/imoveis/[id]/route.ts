import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firstZodMessage, jsonError, readJson } from "@/lib/api-helpers";
import { removePath } from "@/lib/storage";
import {
  publicationPendencias,
  updateSchema,
} from "@/lib/validation/imovel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHANGEABLE_STATUSES = [
  "RASCUNHO",
  "ATIVO",
  "RESERVADO",
  "VENDIDO",
  "ALUGADO",
  "DESATIVADO",
];

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const property = await db.property.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { position: "asc" } },
      video: true,
      publications: true,
      broker: true,
      tradePreference: true,
    },
  });
  if (!property) return jsonError("Imóvel não encontrado", 404);
  return NextResponse.json({ property });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const existing = await db.property.findUnique({
    where: { id },
    include: { _count: { select: { photos: true } } },
  });
  if (!existing) return jsonError("Imóvel não encontrado", 404);

  const body = (await readJson(request)) as {
    data?: unknown;
    wizardStep?: unknown;
    status?: unknown;
    publishedOnSite?: unknown;
  } | null;
  if (!body) return jsonError("Requisição inválida");

  const update: Record<string, unknown> = {};

  if (body.publishedOnSite !== undefined) {
    // Publicação no site é decisão da equipe sobre imóveis da imobiliária.
    if (existing.source === "LEAD") {
      return jsonError("Imóveis de clientes (permuta) não vão para o site.");
    }
    update.publishedOnSite = Boolean(body.publishedOnSite);
  }

  if (body.data !== undefined) {
    const parsed = updateSchema.safeParse(body.data);
    if (!parsed.success) return jsonError(firstZodMessage(parsed.error));
    const { amenities, capturedAt, brokerId, ...rest } = parsed.data;
    Object.assign(update, rest);
    if (amenities !== undefined) update.amenities = JSON.stringify(amenities);
    if (capturedAt !== undefined) {
      update.capturedAt = capturedAt
        ? new Date(`${capturedAt}T12:00:00`)
        : null;
    }
    if (brokerId !== undefined) update.brokerId = brokerId || null;
  }

  if (body.wizardStep !== undefined) {
    const step = Number(body.wizardStep);
    if (!Number.isInteger(step) || step < 1 || step > 8) {
      return jsonError("Etapa inválida");
    }
    update.wizardStep = Math.max(existing.wizardStep, step);
  }

  if (body.status !== undefined) {
    // Imóvel de cliente tem gestão própria (Permutas → Imóveis de clientes);
    // mudar o status por aqui o faria sumir de todas as telas de gestão.
    if (existing.source === "LEAD") {
      return jsonError(
        "Este é um imóvel de cliente. Gerencie em Permutas → Imóveis de clientes.",
      );
    }
    const status = String(body.status);
    if (!CHANGEABLE_STATUSES.includes(status)) {
      return jsonError("Situação inválida");
    }
    if (status === "ATIVO") {
      const merged = { ...existing, ...update } as typeof existing &
        Record<string, unknown>;
      const pendencias = publicationPendencias({
        title: merged.title,
        purpose: merged.purpose,
        propertyType: merged.propertyType,
        neighborhood: merged.neighborhood,
        description: merged.description,
        priceOnRequest: Boolean(merged.priceOnRequest),
        salePrice: merged.salePrice,
        rentPrice: merged.rentPrice,
        seasonDailyPrice: merged.seasonDailyPrice,
        photosCount: existing._count.photos,
      });
      if (pendencias.length > 0) {
        return jsonError(
          "Ainda faltam informações para publicar este imóvel.",
          400,
          { pendencias },
        );
      }
    }
    update.status = status;
  }

  if (Object.keys(update).length === 0) {
    return jsonError("Nada para salvar");
  }

  const property = await db.property.update({ where: { id }, data: update });
  return NextResponse.json({
    ok: true,
    status: property.status,
    wizardStep: property.wizardStep,
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await db.property.findUnique({ where: { id } });
  if (!existing) return jsonError("Imóvel não encontrado", 404);
  // Imóvel de cliente tem gestão própria (Permutas → Imóveis de clientes).
  if (existing.source === "LEAD") {
    return jsonError(
      "Este é um imóvel de cliente. Gerencie em Permutas → Imóveis de clientes.",
    );
  }
  // Apagar de vez é só para rascunho; imóvel publicado sai de cena mudando a
  // situação (Vendido/Alugado/Desativado), sem perder histórico e fotos.
  if (existing.status !== "RASCUNHO") {
    return jsonError(
      "Só rascunhos podem ser excluídos. Para tirar um imóvel do ar, mude a situação dele na ficha.",
    );
  }
  await db.property.delete({ where: { id } });
  await removePath(`properties/${id}`);
  return NextResponse.json({ ok: true });
}
