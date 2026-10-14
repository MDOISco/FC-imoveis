import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import {
  hashLinkPassword,
  LINK_RULES,
  linkToDto,
  newLinkToken,
} from "@/lib/exclusivo";
import { getSettings, publicBaseUrl } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const [links, settings] = await Promise.all([
    db.privateLink.findMany({
      where: { propertyId: id },
      orderBy: { createdAt: "desc" },
    }),
    getSettings(),
  ]);
  const base = publicBaseUrl(settings);
  return NextResponse.json({ links: links.map((l) => linkToDto(l, base)) });
}

/** Cria um link privado: o corretor escolhe o nome do cliente e a senha. */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const property = await db.property.findUnique({ where: { id } });
  if (!property) return jsonError("Imóvel não encontrado", 404);
  if (property.source === "LEAD") {
    return jsonError(
      "Imóveis de clientes (permuta) não têm link exclusivo por aqui.",
    );
  }

  const body = (await readJson(request)) as {
    clientName?: unknown;
    senha?: unknown;
  } | null;
  const clientName = String(body?.clientName ?? "").trim();
  const senha = String(body?.senha ?? "").trim();

  if (
    clientName.length < LINK_RULES.clientNameMin ||
    clientName.length > LINK_RULES.clientNameMax
  ) {
    return jsonError("Digite o nome do cliente (2 a 60 letras).");
  }
  if (
    senha.length < LINK_RULES.senhaMin ||
    senha.length > LINK_RULES.senhaMax
  ) {
    return jsonError("A senha precisa ter de 4 a 40 caracteres.");
  }

  const token = newLinkToken();
  const link = await db.privateLink.create({
    data: {
      propertyId: id,
      token,
      clientName,
      passwordHash: await hashLinkPassword(token, senha),
    },
  });

  const settings = await getSettings();
  return NextResponse.json({
    ok: true,
    link: linkToDto(link, publicBaseUrl(settings)),
  });
}
