import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { firstZodMessage, jsonError, readJson } from "@/lib/api-helpers";
import {
  atualizarLocalizacao,
  removerPosicao,
  salvarPosicaoManual,
} from "@/lib/geo/imovel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Ponto no mapa de um imóvel (só a equipe; a rota é protegida pelo
// middleware). A coordenada nunca sai daqui para o público.

type Params = { params: Promise<{ id: string }> };

async function imovelDaEquipe(id: string) {
  const property = await db.property.findUnique({ where: { id } });
  if (!property) return { erro: jsonError("Imóvel não encontrado", 404) };
  // Imóvel de cliente tem gestão própria (Permutas → Imóveis de clientes).
  if (property.source === "LEAD") {
    return {
      erro: jsonError(
        "Este é um imóvel de cliente. Gerencie em Permutas → Imóveis de clientes.",
      ),
    };
  }
  return { property };
}

async function resposta(id: string, extra?: Record<string, unknown>) {
  const p = await db.property.findUniqueOrThrow({ where: { id } });
  return NextResponse.json({
    ok: true,
    latitude: p.latitude,
    longitude: p.longitude,
    geoPrecision: p.geoPrecision,
    ...extra,
  });
}

// Ponto marcado à mão (arrastando o marcador). Caixa larga do Brasil só
// para barrar valores absurdos.
const posicaoSchema = z.object({
  latitude: z.number("Posição inválida").min(-34).max(6),
  longitude: z.number("Posição inválida").min(-74).max(-34),
});

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const { erro } = await imovelDaEquipe(id);
  if (erro) return erro;
  const parsed = posicaoSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error));
  await salvarPosicaoManual(id, parsed.data.latitude, parsed.data.longitude);
  return resposta(id);
}

/** Procura de novo pelo endereço do cadastro (substitui a posição atual). */
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const { erro } = await imovelDaEquipe(id);
  if (erro) return erro;
  const resultado = await atualizarLocalizacao(id, { forcar: true });
  if (resultado === "falhou") {
    return jsonError(
      "O serviço de mapas não respondeu agora. Tente de novo em alguns minutos.",
      503,
    );
  }
  return resposta(id, { resultado });
}

/** Tira o imóvel do mapa (o site para de mostrar o que tem perto). */
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const { erro } = await imovelDaEquipe(id);
  if (erro) return erro;
  await removerPosicao(id);
  return resposta(id);
}
