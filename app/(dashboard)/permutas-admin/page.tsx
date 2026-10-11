import { KeyRound } from "lucide-react";
import {
  AdminAprovacaoCard,
  type AprovacaoItem,
} from "@/components/permutas/admin-aprovacao-card";
import {
  AdminClientes,
  type ClienteImovelItem,
} from "@/components/permutas/admin-clientes";
import {
  AdminEnderecos,
  type PedidoEnderecoItem,
} from "@/components/permutas/admin-enderecos";
import {
  AdminInteresses,
  type InteresseItem,
} from "@/components/permutas/admin-interesses";
import {
  AdminMatches,
  type AdminMatchItem,
} from "@/components/permutas/admin-matches";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import {
  CASH_TOPUP_OPTIONS,
  labelOf,
  PROPERTY_TYPE_LABELS,
} from "@/lib/constants";
import { db } from "@/lib/db";
import { formatBRL, formatDate } from "@/lib/format";
import { specsSummary } from "@/lib/property-display";

export const dynamic = "force-dynamic";

export const metadata = { title: "Permutas" };

function parseList(json: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function propertyLabel(p: {
  refCode: string;
  propertyType: string | null;
  neighborhood: string | null;
  city: string;
}): string {
  const type = p.propertyType ? PROPERTY_TYPE_LABELS[p.propertyType] : "Imóvel";
  return `${p.refCode} · ${type}${p.neighborhood ? ` · ${p.neighborhood}` : ""} · ${p.city}`;
}

export default async function PermutasAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const { aba } = await searchParams;

  const [aprovacoes, clientes, likedSwipes, matches, enderecos] =
    await Promise.all([
    db.property.findMany({
      where: { source: "LEAD", status: "EM_APROVACAO" },
      include: {
        photos: { orderBy: { position: "asc" } },
        lead: true,
        tradePreference: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    // Imóveis de clientes já revisados (gestão: tirar do ar / excluir)
    db.property.findMany({
      where: {
        source: "LEAD",
        status: { in: ["ATIVO", "DESATIVADO", "REPROVADO"] },
      },
      include: { photos: { orderBy: { position: "asc" } }, lead: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.swipe.findMany({
      where: { liked: true, toProperty: { source: "CORRETOR" } },
      include: {
        fromProperty: { include: { lead: true } },
        toProperty: { include: { photos: { orderBy: { position: "asc" } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.tradeMatch.findMany({
      include: {
        propertyA: {
          include: {
            photos: { orderBy: { position: "asc" } },
            lead: true,
            broker: true,
          },
        },
        propertyB: {
          include: {
            photos: { orderBy: { position: "asc" } },
            lead: true,
            broker: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.addressRequest.findMany({
      include: { property: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
    }),
  ]);

  // Interesses pendentes = curtida em imóvel da carteira SEM resposta recíproca
  const reciprocal = await db.swipe.findMany({
    where: {
      OR: likedSwipes.map((s) => ({
        fromPropertyId: s.toPropertyId,
        toPropertyId: s.fromPropertyId,
      })),
    },
    select: { fromPropertyId: true, toPropertyId: true },
  });
  const answered = new Set(
    reciprocal.map((r) => `${r.fromPropertyId}:${r.toPropertyId}`),
  );
  const pendingInterests = likedSwipes.filter(
    (s) => !answered.has(`${s.toPropertyId}:${s.fromPropertyId}`),
  );

  const aprovacaoItems: AprovacaoItem[] = aprovacoes.map((p) => {
    const pref = p.tradePreference;
    const prefParts: string[] = [];
    if (pref) {
      const types = parseList(pref.types)
        .map((t) => PROPERTY_TYPE_LABELS[t])
        .filter(Boolean);
      if (types.length) prefParts.push(types.join(" ou "));
      const neigh = parseList(pref.neighborhoods);
      if (neigh.length) prefParts.push(`bairros: ${neigh.join(", ")}`);
      if (pref.minBedrooms) prefParts.push(`${pref.minBedrooms}+ quartos`);
      if (pref.minParking) prefParts.push(`${pref.minParking}+ vagas`);
      if (pref.maxValue) prefParts.push(`até ${formatBRL(pref.maxValue)}`);
      prefParts.push(labelOf(CASH_TOPUP_OPTIONS, pref.cashTopUp).toLowerCase());
      if (pref.notes) prefParts.push(`"${pref.notes}"`);
    }
    return {
      id: p.id,
      refCode: p.refCode,
      typeLabel: p.propertyType
        ? PROPERTY_TYPE_LABELS[p.propertyType]
        : "Imóvel",
      location: `${p.neighborhood ? `${p.neighborhood}, ` : ""}${p.city}`,
      specs: specsSummary(p) || "sem detalhes",
      valueLabel: p.salePrice
        ? `valor estimado ${formatBRL(p.salePrice)}`
        : "sem valor estimado",
      leadDescription: p.leadDescription ?? "",
      leadName: p.lead?.name ?? "—",
      leadWhatsapp: p.lead?.whatsapp ?? "—",
      leadEmail: p.lead?.email ?? null,
      preferenceSummary: prefParts.join(" · ") || "sem preferências",
      photos: p.photos.map((f) => ({
        thumbUrl: `/api/arquivos/${f.thumbPath}?v=${f.updatedAt.getTime()}`,
      })),
      createdAt: formatDate(p.createdAt),
    };
  });

  const clienteItems: ClienteImovelItem[] = clientes.map((p) => {
    const cover = p.photos.find((f) => f.isCover) ?? p.photos[0];
    return {
      id: p.id,
      refCode: p.refCode,
      typeLabel: p.propertyType
        ? PROPERTY_TYPE_LABELS[p.propertyType]
        : "Imóvel",
      location: `${p.neighborhood ? `${p.neighborhood}, ` : ""}${p.city}`,
      specs: specsSummary(p) || "sem detalhes",
      status: p.status,
      leadName: p.lead?.name ?? "—",
      leadWhatsapp: p.lead?.whatsapp ?? "—",
      thumbUrl: cover
        ? `/api/arquivos/${cover.thumbPath}?v=${cover.updatedAt.getTime()}`
        : null,
      createdAt: formatDate(p.createdAt),
    };
  });

  const interesseItems: InteresseItem[] = pendingInterests.map((s) => {
    const cover =
      s.toProperty.photos.find((f) => f.isCover) ?? s.toProperty.photos[0];
    return {
      swipeId: s.id,
      createdAt: s.createdAt.toISOString(),
      leadName: s.fromProperty.lead?.name ?? "Cliente",
      leadWhatsapp: s.fromProperty.lead?.whatsapp ?? "—",
      leadPropertyLabel: propertyLabel(s.fromProperty),
      targetId: s.toPropertyId,
      targetLabel: s.toProperty.title ?? propertyLabel(s.toProperty),
      targetThumb: cover
        ? `/api/arquivos/${cover.thumbPath}?v=${cover.updatedAt.getTime()}`
        : null,
    };
  });

  const matchItems: AdminMatchItem[] = matches.map((m) => {
    const side = (p: (typeof m)["propertyA"]) => {
      const cover = p.photos.find((f) => f.isCover) ?? p.photos[0];
      return {
        label: propertyLabel(p),
        thumb: cover
          ? `/api/arquivos/${cover.thumbPath}?v=${cover.updatedAt.getTime()}`
          : null,
        contactName:
          p.lead?.name ??
          p.ownerName ??
          (p.broker ? `corretor ${p.broker.name}` : "Proprietário"),
        contactPhone: p.lead?.whatsapp ?? p.ownerPhone ?? p.broker?.phone ?? "",
        isPortfolio: p.source === "CORRETOR",
      };
    };
    return {
      id: m.id,
      createdAt: m.createdAt.toISOString(),
      status: m.status,
      a: side(m.propertyA),
      b: side(m.propertyB),
    };
  });

  const enderecoItems: PedidoEnderecoItem[] = enderecos.map((e) => ({
    id: e.id,
    createdAt: e.createdAt.toISOString(),
    status: e.status,
    name: e.name,
    email: e.email,
    phone: e.phone,
    propertyId: e.propertyId,
    propertyLabel: e.property.title ?? propertyLabel(e.property),
    fullAddress: [
      [e.property.street, e.property.streetNumber].filter(Boolean).join(", "),
      e.property.neighborhood,
      e.property.city,
    ]
      .filter(Boolean)
      .join(" — "),
  }));

  const novosMatches = matches.filter((m) => m.status === "NOVO").length;
  const novosEnderecos = enderecos.filter((e) => e.status === "NOVO").length;
  const active = [
    "aprovacoes",
    "clientes",
    "interesses",
    "matches",
    "enderecos",
  ].includes(aba ?? "")
    ? aba!
    : "aprovacoes";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-extrabold text-stone-900">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-gold-400 text-gold-950">
            <KeyRound className="size-7" />
          </span>
          Permutas
        </h1>
        <p className="mt-1 text-base text-stone-500">
          Aprove os imóveis dos clientes, responda interesses e conduza os
          matches da chave dourada.
        </p>
      </div>

      <Tabs
        items={[
          {
            value: "aprovacoes",
            label: "Aprovações",
            href: "/permutas-admin?aba=aprovacoes",
            count: aprovacaoItems.length,
          },
          {
            value: "clientes",
            label: "Imóveis de clientes",
            href: "/permutas-admin?aba=clientes",
            count: clienteItems.length,
          },
          {
            value: "interesses",
            label: "Interesses",
            href: "/permutas-admin?aba=interesses",
            count: interesseItems.length,
          },
          {
            value: "matches",
            label: "Matches",
            href: "/permutas-admin?aba=matches",
            count: novosMatches,
          },
          {
            value: "enderecos",
            label: "Pedidos de endereço",
            href: "/permutas-admin?aba=enderecos",
            count: novosEnderecos,
          },
        ]}
        active={active}
      />

      {active === "aprovacoes" &&
        (aprovacaoItems.length === 0 ? (
          <EmptyState
            title="Nenhum cadastro aguardando aprovação"
            description="Quando um cliente cadastrar o imóvel dele na página de Permutas, ele chega aqui para a equipe revisar e publicar."
          />
        ) : (
          <div className="space-y-5">
            {aprovacaoItems.map((item) => (
              <AdminAprovacaoCard key={item.id} item={item} />
            ))}
          </div>
        ))}
      {active === "clientes" && <AdminClientes items={clienteItems} />}
      {active === "interesses" && <AdminInteresses items={interesseItems} />}
      {active === "matches" && <AdminMatches items={matchItems} />}
      {active === "enderecos" && <AdminEnderecos items={enderecoItems} />}
    </div>
  );
}
