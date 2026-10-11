import { CalendarDays } from "lucide-react";
import type { Prisma } from "@prisma/client";
import {
  AgendaCard,
  type AgendamentoItem,
} from "@/components/agenda/agenda-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import {
  chaveDiaSP,
  dataSP,
  formatarDataHoraSP,
  partesSP,
} from "@/lib/agenda/slots";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDateTime, maskPhone } from "@/lib/format";
import { waHref } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export const metadata = { title: "Agenda" };

type ApFull = Prisma.AppointmentGetPayload<{
  include: { property: true; broker: true };
}>;

function toItem(ap: ApFull): AgendamentoItem {
  const quando = formatarDataHoraSP(ap.startsAt);
  const horario = quando.split(" às ")[1] ?? quando;
  const p = ap.property;
  const typeLabel = p?.propertyType
    ? (PROPERTY_TYPE_LABELS[p.propertyType] ?? "Imóvel")
    : "Imóvel";
  return {
    id: ap.id,
    horario,
    quando,
    nome: ap.name,
    whatsappLabel: maskPhone(ap.phone) || ap.phone,
    whatsappHref: waHref(
      ap.phone,
      `Olá, ${ap.name}! Aqui é da FC Imóveis, sobre a sua visita agendada (${quando}).`,
    ),
    email: ap.email,
    imovelId: p?.id ?? null,
    imovelLabel: p
      ? `${p.refCode} · ${p.title ?? `${typeLabel}${p.neighborhood ? ` — ${p.neighborhood}` : ""}`}`
      : "Atendimento na imobiliária",
    corretor: ap.broker?.name ?? null,
    status: ap.status,
    criadoEm: formatDateTime(ap.createdAt),
  };
}

type Grupo = { chave: string; rotulo: string; items: AgendamentoItem[] };

/** Agrupa agendamentos (já ordenados) por dia, em hora de Brasília. */
function agruparPorDia(aps: ApFull[]): Grupo[] {
  const grupos: Grupo[] = [];
  for (const ap of aps) {
    const chave = chaveDiaSP(ap.startsAt);
    let grupo = grupos[grupos.length - 1];
    if (!grupo || grupo.chave !== chave) {
      grupo = {
        chave,
        rotulo: formatarDataHoraSP(ap.startsAt).split(" às ")[0] ?? chave,
        items: [],
      };
      grupos.push(grupo);
    }
    grupo.items.push(toItem(ap));
  }
  return grupos;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const { aba } = await searchParams;
  const active = aba === "anteriores" ? "anteriores" : "proximos";

  const agora = new Date();
  const hoje = partesSP(agora);
  const inicioHoje = dataSP(hoje.ano, hoje.mes, hoje.dia);
  const hojeChave = chaveDiaSP(agora);
  const hojeRotulo = formatarDataHoraSP(agora).split(" às ")[0] ?? hojeChave;

  const [proximos, anteriores] = await Promise.all([
    db.appointment.findMany({
      where: { startsAt: { gte: inicioHoje } },
      include: { property: true, broker: true },
      orderBy: { startsAt: "asc" },
    }),
    db.appointment.findMany({
      where: { startsAt: { lt: inicioHoje } },
      include: { property: true, broker: true },
      orderBy: { startsAt: "desc" },
      take: 40,
    }),
  ]);

  const gruposProximos = agruparPorDia(proximos);
  const gruposAnteriores = agruparPorDia(anteriores);
  const grupoHoje = gruposProximos.find((g) => g.chave === hojeChave);
  const gruposFuturos = gruposProximos.filter((g) => g.chave !== hojeChave);
  const aguardando = proximos.filter((a) => a.status === "AGENDADO").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 font-display text-4xl font-bold text-stone-900">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-700 text-white">
            <CalendarDays className="size-7" />
          </span>
          Agenda de visitas
        </h1>
        <p className="mt-1 text-base text-stone-500">
          Os clientes agendam sozinhos pela página pública{" "}
          <span className="font-semibold text-stone-700">/agendar</span> e pelos
          botões “Agendar visita” do site. Confirme, cancele ou marque como
          realizada por aqui.
        </p>
      </div>

      <Tabs
        items={[
          {
            value: "proximos",
            label: "Próximas",
            href: "/agenda?aba=proximos",
            count: aguardando,
          },
          {
            value: "anteriores",
            label: "Anteriores",
            href: "/agenda?aba=anteriores",
          },
        ]}
        active={active}
      />

      {active === "proximos" && (
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-stone-900">
              Hoje <span className="text-stone-400">— {hojeRotulo}</span>
            </h2>
            {grupoHoje ? (
              <div className="space-y-4">
                {grupoHoje.items.map((item) => (
                  <AgendaCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-6 py-6 text-base text-stone-500">
                Nenhuma visita marcada para hoje.
              </p>
            )}
          </section>

          {gruposFuturos.map((grupo) => (
            <section key={grupo.chave} className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-stone-900">
                {grupo.rotulo}
              </h2>
              <div className="space-y-4">
                {grupo.items.map((item) => (
                  <AgendaCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}

          {proximos.length === 0 && (
            <EmptyState
              icon={<CalendarDays className="size-12" />}
              title="Nenhuma visita agendada"
              description="Quando um cliente agendar pelo site, a visita aparece aqui com os horários já organizados por corretor, sem choque de agenda."
            />
          )}
        </div>
      )}

      {active === "anteriores" &&
        (gruposAnteriores.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="size-12" />}
            title="Nenhum agendamento anterior"
            description="As visitas passadas recentes ficam guardadas aqui."
          />
        ) : (
          <div className="space-y-8">
            {gruposAnteriores.map((grupo) => (
              <section key={grupo.chave} className="space-y-4">
                <h2 className="font-display text-2xl font-bold text-stone-900">
                  {grupo.rotulo}
                </h2>
                <div className="space-y-4">
                  {grupo.items.map((item) => (
                    <AgendaCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ))}
    </div>
  );
}
