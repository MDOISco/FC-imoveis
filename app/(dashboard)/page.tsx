import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { Filters } from "@/components/dashboard/filters";
import {
  PropertyCard,
  type PropertyWithRelations,
} from "@/components/dashboard/property-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
  const ordem = first(params.ordem) || "recentes";

  const where: Prisma.PropertyWhereInput = { source: "CORRETOR" };
  if (status === "VENDIDO") {
    where.status = { in: ["VENDIDO", "ALUGADO"] };
  } else if (status) {
    where.status = status;
  }
  if (tipo) where.propertyType = tipo;
  if (finalidade) where.purpose = finalidade;
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

  const [
    properties,
    total,
    ativos,
    rascunhos,
    negociados,
    permutasPendentes,
    matchesNovos,
    pedidosEndereco,
  ] = await Promise.all([
    db.property.findMany({
      where,
      orderBy,
      include: {
        photos: { orderBy: { position: "asc" } },
        publications: true,
      },
      take: 60,
    }),
    db.property.count({ where: { source: "CORRETOR" } }),
    db.property.count({ where: { source: "CORRETOR", status: "ATIVO" } }),
    db.property.count({ where: { source: "CORRETOR", status: "RASCUNHO" } }),
    db.property.count({
      where: { source: "CORRETOR", status: { in: ["VENDIDO", "ALUGADO"] } },
    }),
    db.property.count({ where: { source: "LEAD", status: "EM_APROVACAO" } }),
    db.tradeMatch.count({ where: { status: "NOVO" } }),
    db.addressRequest.count({ where: { status: "NOVO" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900">
            Meus imóveis
          </h1>
          <p className="mt-1 text-base text-stone-500">
            Cadastre, publique nos portais e acompanhe as permutas.
          </p>
        </div>
        <Link href="/imoveis/novo" className={buttonClasses("primary", "lg")}>
          <Plus className="size-6" /> Cadastrar imóvel
        </Link>
      </div>

      <StatsCards
        total={total}
        ativos={ativos}
        rascunhos={rascunhos}
        negociados={negociados}
        permutasPendentes={permutasPendentes}
        matchesNovos={matchesNovos}
        pedidosEndereco={pedidosEndereco}
      />

      <Filters
        busca={busca}
        status={status}
        tipo={tipo}
        finalidade={finalidade}
        ordem={ordem}
      />

      {properties.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-14" />}
          title={
            busca || status || tipo || finalidade
              ? "Nenhum imóvel encontrado com esses filtros"
              : "Nenhum imóvel cadastrado ainda"
          }
          description={
            busca || status || tipo || finalidade
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
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard
              key={p.id}
              property={p as PropertyWithRelations}
            />
          ))}
        </div>
      )}
    </div>
  );
}
