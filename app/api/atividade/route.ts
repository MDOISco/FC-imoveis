import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-helpers";
import {
  cidadePorIp,
  isVisitEventType,
  VISIT_LIMITS,
  type VisitOrigin,
} from "@/lib/atividade";
import { ACCESS_COOKIE, expectedToken, safeEqual } from "@/lib/auth";
import { db } from "@/lib/db";
import { linkCookieName } from "@/lib/exclusivo";
import { clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rota PÚBLICA (chamada pelo navegador do cliente na apresentação exclusiva e
// na página do site). Três ações num único endereço:
//   abrir  → cria (ou reaproveita) a visita e devolve o id
//   pulso  → atualiza tempo na página e rolagem
//   evento → registra um clique (WhatsApp, Agendar, foto, vídeo, seção vista)
// Qualquer problema responde 2xx sem corpo útil: o cliente nunca vê erro.

// Freio: visitas novas por IP e por hora (memória do processo).
const aberturas = new Map<string, { count: number; windowStart: number }>();
const UMA_HORA_MS = 60 * 60_000;

function podeAbrir(ip: string): boolean {
  const now = Date.now();
  if (aberturas.size > 5_000) aberturas.clear();
  const atual = aberturas.get(ip);
  if (!atual || now - atual.windowStart > UMA_HORA_MS) {
    aberturas.set(ip, { count: 1, windowStart: now });
    return true;
  }
  atual.count += 1;
  return atual.count <= VISIT_LIMITS.opensPerIpPerHour;
}

const ignorado = () => NextResponse.json({ visitaId: null });
const okVazio = () => NextResponse.json({ ok: true });

type Corpo = {
  acao?: unknown;
  origem?: unknown;
  token?: unknown;
  imovelId?: unknown;
  visitaAnterior?: unknown;
  visitaId?: unknown;
  segundos?: unknown;
  rolagem?: unknown;
  tipo?: unknown;
  rotulo?: unknown;
};

function idValido(v: unknown): v is string {
  return typeof v === "string" && /^[a-z0-9]{10,40}$/i.test(v);
}

/** A própria equipe conferindo a página não conta como cliente. */
async function ehEquipe(): Promise<boolean> {
  const esperado = await expectedToken();
  if (!esperado) return false;
  const jar = await cookies();
  return safeEqual(jar.get(ACCESS_COOKIE)?.value, esperado);
}

async function abrir(request: Request, body: Corpo) {
  if (await ehEquipe()) return ignorado();
  const ip = clientIp(request);
  if (!podeAbrir(ip)) return ignorado();

  const origem = body.origem as VisitOrigin;
  let propertyId: string;
  let privateLinkId: string | null = null;

  if (origem === "EXCLUSIVO") {
    const token = body.token;
    if (typeof token !== "string" || !/^[A-Za-z0-9_-]{10,64}$/.test(token)) {
      return ignorado();
    }
    const link = await db.privateLink.findUnique({ where: { token } });
    if (!link || !link.active) return ignorado();
    // Só conta quem realmente abriu a apresentação (digitou a senha).
    const jar = await cookies();
    if (!safeEqual(jar.get(linkCookieName(token))?.value, link.passwordHash)) {
      return ignorado();
    }
    propertyId = link.propertyId;
    privateLinkId = link.id;
  } else if (origem === "SITE") {
    if (!idValido(body.imovelId)) return ignorado();
    const property = await db.property.findFirst({
      where: {
        id: body.imovelId,
        status: "ATIVO",
        source: "CORRETOR",
        publishedOnSite: true,
      },
      select: { id: true },
    });
    if (!property) return ignorado();
    propertyId = property.id;
  } else {
    return ignorado();
  }

  // Recarregou a página há pouco? Continua a mesma visita.
  if (idValido(body.visitaAnterior)) {
    const anterior = await db.visit.findUnique({
      where: { id: body.visitaAnterior },
      select: { id: true, propertyId: true, privateLinkId: true, startedAt: true },
    });
    if (
      anterior &&
      anterior.propertyId === propertyId &&
      anterior.privateLinkId === privateLinkId &&
      Date.now() - anterior.startedAt.getTime() < VISIT_LIMITS.reuseWindowMs
    ) {
      await db.visit.update({
        where: { id: anterior.id },
        data: { lastSeenAt: new Date() },
      });
      return NextResponse.json({ visitaId: anterior.id });
    }
  }

  const geo = await cidadePorIp(ip);
  const visita = await db.visit.create({
    data: {
      propertyId,
      privateLinkId,
      origin: origem,
      city: geo.city,
      region: geo.region,
    },
    select: { id: true },
  });
  return NextResponse.json({ visitaId: visita.id });
}

async function pulso(body: Corpo) {
  if (!idValido(body.visitaId)) return okVazio();
  const segundos = Number(body.segundos);
  const rolagem = Number(body.rolagem);
  if (!Number.isFinite(segundos) || !Number.isFinite(rolagem)) return okVazio();

  const visita = await db.visit.findUnique({
    where: { id: body.visitaId },
    select: { seconds: true, scrollPct: true },
  });
  if (!visita) return okVazio();

  // Só cresce (o navegador manda o total acumulado) e com teto.
  const seconds = Math.min(
    VISIT_LIMITS.maxSeconds,
    Math.max(visita.seconds, Math.floor(segundos)),
  );
  const scrollPct = Math.min(
    100,
    Math.max(visita.scrollPct, Math.floor(rolagem)),
  );
  await db.visit.update({
    where: { id: body.visitaId },
    data: { seconds, scrollPct, lastSeenAt: new Date() },
  });
  return okVazio();
}

async function evento(body: Corpo) {
  if (!idValido(body.visitaId) || !isVisitEventType(body.tipo)) return okVazio();
  const label =
    typeof body.rotulo === "string"
      ? body.rotulo.trim().slice(0, VISIT_LIMITS.labelMax) || null
      : null;

  const visita = await db.visit.findUnique({
    where: { id: body.visitaId },
    select: { id: true, _count: { select: { events: true } } },
  });
  if (!visita || visita._count.events >= VISIT_LIMITS.maxEvents) return okVazio();

  await db.$transaction([
    db.visitEvent.create({
      data: { visitId: visita.id, type: body.tipo, label },
    }),
    db.visit.update({
      where: { id: visita.id },
      data: { lastSeenAt: new Date() },
    }),
  ]);
  return okVazio();
}

export async function POST(request: Request) {
  const body = (await readJson(request)) as Corpo | null;
  if (!body || typeof body !== "object") return jsonError("Pedido inválido.");

  try {
    switch (body.acao) {
      case "abrir":
        return await abrir(request, body);
      case "pulso":
        return await pulso(body);
      case "evento":
        return await evento(body);
      default:
        return jsonError("Ação desconhecida.");
    }
  } catch (err) {
    // Registro de atividade nunca pode atrapalhar o cliente.
    console.error("[atividade]", err);
    return okVazio();
  }
}
