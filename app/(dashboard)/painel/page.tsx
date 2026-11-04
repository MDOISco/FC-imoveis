import Link from "next/link";
import { Building2, EyeOff, LayoutGrid, Plus, Rows3 } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { BrokerChips } from "@/components/dashboard/broker-chips";
import { Filters } from "@/components/dashboard/filters";
import {
  PropertyCard,
  type PropertyWithRelations,
} from "@/components/dashboard/property-card";
import { PropertyTable } from "@/components/dashboard/property-table";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const busca = first(params.busca).trim();
  const status = first(params.status);
  const tipo = first(params.tipo);
  const finalidade = first(params.finalidade);
  const corretor = first(params.corretor);
  const ordem = first(params.ordem) || "recentes";
  const visao = first(params.visao) === "lista" ? "lista" : "cards";
  // "fora" = só os imóveis ativos que ainda não aparecem no site
  const site = first(params.site) === "fora" ? "fora" : "";

  const where: Prisma.PropertyWhereInput = { source: "CORRETOR" };
  if (status === "VENDIDO") {
    where.status = { in: ["VENDIDO", "ALUGADO"] };
  } else if (status) {
    where.status = status;
  }
  if (tipo) where.propertyType = tipo;
  if (finalidade === "PERMUTA") where.acceptsTrade = true;
  else if (finalidade) where.purpose = finalidade;
  if (corretor) where.brokerId = corretor;
  if (site === "fora") {
    where.status = "ATIVO";
    where.publishedOnSite = false;
  }
  if (busca) {
    where.OR = [
      { refCode: { contains: busca } },
      { title: { contains: busca } },
      { neighborhood: { contains: busca } },
      { condoName: { contains: busca } },
    ];
  }

  const orderBy: Prisma.PropertyOrderByWithRelationInput[] =
    ordem === "antigos"
      ? [{ createdAt: "asc" }]
      : ordem === "maior-preco"
        ? [
            { salePrice: { sort: "desc", nulls: "last" } },
            { rentPrice: { sort: "desc", nulls: "last" } },
          ]
        : ordem === "menor-preco"
          ? [
              { salePrice: { sort: "asc", nulls: "last" } },
              { rentPrice: { sort: "asc", nulls: "last" } },
            ]
          : [{ createdAt: "desc" }];

  // Stats respeitam o corretor selecionado (visão "meus imóveis")
  const statsBase: Prisma.PropertyWhereInput = { source: "CORRETOR" };
  if (corretor) statsBase.brokerId = corretor;

  const [
    properties,
    total,
    ativos,
    rascunhos,
    negociados,
    permutasPendentes,
    matchesNovos,
    pedidosEndereco,
    brokers,
    countsByBroker,
    totalCarteira,
    foraDoSite,
  ] = await Promise.all([
    db.property.findMany({
      where,
      orderBy,
      include: {
        photos: { orderBy: { position: "asc" } },
        publications: true,
        broker: true,
      },
      take: 100,
    }),
    db.property.count({ where: statsBase }),
    db.property.count({ where: { ...statsBase, status: "ATIVO" } }),
    db.property.count({ where: { ...statsBase, status: "RASCUNHO" } }),
    db.property.count({
      where: { ...statsBase, status: { in: ["VENDIDO", "ALUGADO"] } },
    }),
    db.property.count({ where: { source: "LEAD", status: "EM_APROVACAO" } }),
    db.tradeMatch.count({ where: { status: "NOVO" } }),
    db.addressRequest.count({ where: { status: "NOVO" } }),
    db.broker.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.property.groupBy({
      by: ["brokerId"],
      where: { source: "CORRETOR" },
      _count: { _all: true },
    }),
    db.property.count({ where: { source: "CORRETOR" } }),
    db.property.count({
      where: { ...statsBase, status: "ATIVO", publishedOnSite: false },
    }),
  ]);

  const countByBrokerId = new Map(
    countsByBroker.map((c) => [c.brokerId, c._count._all]),
  );
  const selectedBroker = brokers.find((b) => b.id === corretor);

  // Monta URLs preservando os filtros atuais
  function buildHref(overrides: Record<string, string>): string {
    const q = new URLSearchParams();
    const current: Record<string, string> = {
      busca,
      status,
      tipo,
      finalidade,
      corretor,
      ordem: ordem === "recentes" ? "" : ordem,
      visao: visao === "cards" ? "" : visao,
      site,
    };
    for (const [key, value] of Object.entries({ ...current, ...overrides })) {
      if (value) q.set(key, value);
    }
    const s = q.toString();
    return s ? `/painel?${s}` : "/painel";
  }

  const hasFilters = busca || status || tipo || finalidade || corretor || site;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-brand-950 shadow-lg">
        <div className="flex flex-col justify-between gap-6 px-6 pb-8 pt-8 sm:flex-row sm:items-end sm:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-gold-300">
              FC Imóveis · Bragança Paulista
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold text-white sm:text-5xl">
              {selectedBroker
                ? `Imóveis de ${selectedBroker.name.split(" ")[0]}`
                : "Meus imóveis"}
            </h1>
            <p className="mt-3 max-w-xl text-lg text-brand-100">
              {selectedBroker
                ? `Carteira do corretor ${selectedBroker.name}.`
                : "Cadastre, publique nos portais e acompanhe as permutas."}
            </p>
          </div>
          <Link
            href="/imoveis/novo"
            className={buttonClasses("gold", "lg") + " shrink-0"}
          >
            <Plus className="size-6" /> Cadastrar imóvel
          </Link>
        </div>
        <div className="border-t border-white/10">
          <StatsCards
            total={total}
            ativos={ativos}
            rascunhos={rascunhos}
            negociados={negociados}
            permutasPendentes={permutasPendentes}
            matchesNovos={matchesNovos}
            pedidosEndereco={pedidosEndereco}
          />
        </div>
      </section>

      {(foraDoSite > 0 || site === "fora") && (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-3 text-lg font-semibold text-amber-900">
            <EyeOff className="mt-0.5 size-6 shrink-0" />
            <span>
              {foraDoSite === 0
                ? "Pronto: todos os imóveis ativos já estão no site."
                : foraDoSite === 1
                  ? "1 imóvel ativo ainda não aparece no site."
                  : `${foraDoSite} imóveis ativos ainda não aparecem no site.`}
              <span className="block text-base font-normal">
                Para colocar: abra o imóvel e ligue “Publicar no site”, no
                quadro “Site da FC Imóveis”.
              </span>
            </span>
          </p>
          {site === "fora" ? (
            <Link
              href={buildHref({ site: "" })}
              className={buttonClasses("secondary", "lg") + " shrink-0"}
            >
              Ver todos os imóveis
            </Link>
          ) : (
            <Link
              href={buildHref({ site: "fora" })}
              className={buttonClasses("gold", "lg") + " shrink-0"}
            >
              Ver quais são
            </Link>
          )}
        </div>
      )}

      <BrokerChips
        brokers={brokers.map((b) => ({
          id: b.id,
          name: b.name,
          count: countByBrokerId.get(b.id) ?? 0,
        }))}
        total={totalCarteira}
        selected={corretor}
        buildHref={(id) => buildHref({ corretor: id })}
      />

      <Filters
        busca={busca}
        status={status}
        tipo={tipo}
        finalidade={finalidade}
        corretor={corretor}
        ordem={ordem}
        visao={visao === "lista" ? "lista" : ""}
        brokers={brokers.map((b) => ({ value: b.id, label: b.name }))}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-semibold text-stone-600">
          {properties.length} imóvel(is){hasFilters ? " com esses filtros" : ""}
        </p>
        <div
          className="flex rounded-xl border-2 border-stone-200 bg-white p-1"
          role="group"
          aria-label="Modo de visualização"
        >
          <Link
            href={buildHref({ visao: "" })}
            aria-current={visao === "cards" ? "true" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3.5 font-semibold",
              visao === "cards"
                ? "bg-brand-700 text-white"
                : "text-stone-600 hover:bg-stone-100",
            )}
          >
            <LayoutGrid className="size-5" /> Cards
          </Link>
          <Link
            href={buildHref({ visao: "lista" })}
            aria-current={visao === "lista" ? "true" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3.5 font-semibold",
              visao === "lista"
                ? "bg-brand-700 text-white"
                : "text-stone-600 hover:bg-stone-100",
            )}
          >
            <Rows3 className="size-5" /> Lista
          </Link>
        </div>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-14" />}
          title={
            hasFilters
              ? "Nenhum imóvel encontrado com esses filtros"
              : "Nenhum imóvel cadastrado ainda"
          }
          description={
            hasFilters
              ? "Tente mudar ou limpar os filtros acima."
              : "Clique no botão abaixo para cadastrar o primeiro imóvel. É um passo a passo simples."
          }
          action={
            <Link
              href="/imoveis/novo"
              className={buttonClasses("primary", "lg")}
            >
              <Plus className="size-6" /> Cadastrar imóvel
            </Link>
          }
        />
      ) : visao === "lista" ? (
        <PropertyTable
          properties={properties as Parameters<typeof PropertyTable>[0]["properties"]}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p as PropertyWithRelations} />
          ))}
        </div>
      )}
    </div>
  );
}
