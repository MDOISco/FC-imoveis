import Link from "next/link";
import {
  Activity,
  CalendarDays,
  Camera,
  Clock3,
  Eye,
  Globe,
  MapPin,
  MessageCircle,
  MoveVertical,
  PlayCircle,
  Sparkles,
  UserRound,
} from "lucide-react";
import { BotaoAtualizar } from "@/components/atividade/botao-atualizar";
import { formatDuracao, type VisitEventType } from "@/lib/atividade";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { formatDateTime, formatRelative } from "@/lib/format";
import { publicLocation, publicTitle } from "@/lib/property-display";

export const dynamic = "force-dynamic";

export const metadata = { title: "Atividade" };

type Filtro = "todos" | "exclusivo" | "site";
const FILTROS: { key: Filtro; label: string }[] = [
  { key: "todos", label: "Tudo" },
  { key: "exclusivo", label: "Links exclusivos" },
  { key: "site", label: "Site público" },
];

type Params = {
  searchParams: Promise<{ origem?: string; imovel?: string }>;
};

/** Resume os eventos de uma visita em frases curtas para o cartão. */
function resumirEventos(
  events: { type: string; label: string | null }[],
): { icon: React.ElementType; texto: string; forte?: boolean }[] {
  const por = (t: VisitEventType) => events.filter((e) => e.type === t);
  const itens: { icon: React.ElementType; texto: string; forte?: boolean }[] =
    [];

  if (por("WHATSAPP").length > 0) {
    itens.push({
      icon: MessageCircle,
      texto: "Clicou em Falar no WhatsApp",
      forte: true,
    });
  }
  if (por("AGENDAR").length > 0) {
    itens.push({
      icon: CalendarDays,
      texto: "Clicou em Agendar visita",
      forte: true,
    });
  }
  const fotos = new Set(por("FOTO").map((e) => e.label ?? "foto"));
  if (fotos.size > 0) {
    itens.push({
      icon: Camera,
      texto:
        fotos.size === 1
          ? `Ampliou 1 foto`
          : `Ampliou ${fotos.size} fotos diferentes`,
    });
  }
  if (por("VIDEO").length > 0) {
    itens.push({ icon: PlayCircle, texto: "Deu play no vídeo" });
  }
  const secoes = por("SECAO")
    .map((e) => e.label)
    .filter((l): l is string => Boolean(l));
  if (secoes.length > 0) {
    itens.push({ icon: Eye, texto: `Viu: ${secoes.join(", ")}` });
  }
  return itens;
}

export default async function AtividadePage({ searchParams }: Params) {
  const sp = await searchParams;
  const filtro: Filtro =
    sp.origem === "exclusivo" || sp.origem === "site" ? sp.origem : "todos";
  const imovelId = sp.imovel && /^[a-z0-9]{10,40}$/i.test(sp.imovel) ? sp.imovel : null;

  const agora = Date.now();
  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);
  const seteDias = new Date(agora - 7 * 24 * 60 * 60_000);

  const where = {
    ...(filtro === "exclusivo" ? { origin: "EXCLUSIVO" } : {}),
    ...(filtro === "site" ? { origin: "SITE" } : {}),
    ...(imovelId ? { propertyId: imovelId } : {}),
  };

  const [visitas, hoje, semana, imovelFiltro] = await Promise.all([
    db.visit.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: 200,
      include: {
        property: true,
        privateLink: { select: { clientName: true, active: true } },
        events: { orderBy: { at: "asc" } },
      },
    }),
    db.visit.count({ where: { ...where, startedAt: { gte: inicioHoje } } }),
    db.visit.count({ where: { ...where, startedAt: { gte: seteDias } } }),
    imovelId
      ? db.property.findUnique({
          where: { id: imovelId },
          select: { id: true, refCode: true, title: true, propertyType: true, neighborhood: true, addressVisibility: true },
        })
      : Promise.resolve(null),
  ]);

  const linkFiltro = (f: Filtro) =>
    `/atividade?origem=${f}${imovelId ? `&imovel=${imovelId}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 font-display text-4xl font-bold text-stone-900">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gold-400 text-gold-950">
              <Activity className="size-7" />
            </span>
            Atividade
          </h1>
          <p className="mt-2 max-w-3xl text-lg text-stone-600">
            O que os clientes fizeram nas páginas dos imóveis: quando abriram,
            quanto tempo ficaram, o que clicaram e de que cidade. A lista não
            atualiza sozinha — use o botão para ver as novidades.
          </p>
        </div>
        <BotaoAtualizar />
      </div>

      {imovelFiltro && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-brand-200 bg-brand-50 p-4">
          <p className="text-lg text-brand-900">
            Mostrando só o imóvel{" "}
            <strong>
              {imovelFiltro.refCode} · {publicTitle(imovelFiltro)}
            </strong>
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/imoveis/${imovelFiltro.id}`}
              className="inline-flex min-h-12 items-center rounded-xl border-2 border-brand-300 bg-white px-4 font-bold text-brand-900"
            >
              Abrir ficha
            </Link>
            <Link
              href={`/atividade?origem=${filtro}`}
              className="inline-flex min-h-12 items-center rounded-xl px-4 font-bold text-brand-800 underline"
            >
              Ver todos os imóveis
            </Link>
          </div>
        </div>
      )}

      {/* Contadores */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-sm font-bold uppercase tracking-wider text-stone-500">
            Visitas hoje
          </p>
          <p className="mt-1 font-display text-4xl font-bold text-stone-900">
            {hoje}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-sm font-bold uppercase tracking-wider text-stone-500">
            Últimos 7 dias
          </p>
          <p className="mt-1 font-display text-4xl font-bold text-stone-900">
            {semana}
          </p>
        </div>
        <div className="col-span-2 rounded-2xl border border-stone-200 bg-stone-50 p-5 text-base text-stone-600 sm:col-span-1">
          Visitas da própria equipe (quem está entrado no painel) não entram
          na conta. Recarregar a página em menos de 30 minutos continua a
          mesma visita.
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Origem">
        {FILTROS.map((f) => (
          <Link
            key={f.key}
            href={linkFiltro(f.key)}
            role="tab"
            aria-selected={filtro === f.key}
            className={cn(
              "inline-flex min-h-12 items-center rounded-xl border-2 px-5 text-base font-bold transition-colors",
              filtro === f.key
                ? "border-brand-800 bg-brand-800 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:border-brand-400",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {visitas.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-stone-300 bg-white p-10 text-center">
          <Eye className="mx-auto size-12 text-stone-300" />
          <p className="mt-3 text-xl font-bold text-stone-800">
            Nenhuma visita registrada ainda
          </p>
          <p className="mt-2 text-lg text-stone-600">
            Assim que um cliente abrir um link exclusivo (ou a página do
            imóvel no site), ela aparece aqui.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {visitas.map((v) => {
            const exclusivo = v.origin === "EXCLUSIVO";
            const quem = exclusivo
              ? v.privateLink?.clientName ?? "Cliente (link removido)"
              : "Visitante do site";
            const emAndamento = agora - v.lastSeenAt.getTime() < 2 * 60_000;
            const acoes = resumirEventos(v.events);
            const cidade = v.city
              ? `${v.city}${v.region ? `/${v.region}` : ""}`
              : null;
            return (
              <li
                key={v.id}
                className={cn(
                  "rounded-2xl border-2 bg-white p-5",
                  exclusivo ? "border-gold-300" : "border-stone-200",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-xl font-bold text-stone-900">
                      {exclusivo ? (
                        <Sparkles className="size-6 text-gold-600" />
                      ) : (
                        <Globe className="size-6 text-stone-400" />
                      )}
                      {quem}
                      {emAndamento && (
                        <span className="rounded-full bg-brand-100 px-3 py-0.5 text-sm font-bold text-brand-900">
                          na página agora
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-base text-stone-600">
                      {exclusivo ? "Link exclusivo" : "Página do site"} ·{" "}
                      <Link
                        href={`/imoveis/${v.property.id}`}
                        className="font-semibold text-brand-800 underline-offset-2 hover:underline"
                      >
                        {v.property.refCode} · {publicTitle(v.property)}
                      </Link>{" "}
                      <span className="text-stone-400">
                        ({publicLocation(v.property)})
                      </span>
                    </p>
                  </div>
                  <p className="text-right text-base text-stone-600">
                    <span className="block font-bold text-stone-800">
                      {formatRelative(v.startedAt)}
                    </span>
                    {formatDateTime(v.startedAt)}
                  </p>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-stone-50 p-3">
                    <dt className="flex items-center gap-1.5 text-sm font-bold text-stone-500">
                      <Clock3 className="size-4" /> Tempo na página
                    </dt>
                    <dd className="mt-0.5 text-lg font-bold text-stone-900">
                      {v.seconds > 0 ? formatDuracao(v.seconds) : "menos de 1 s"}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-stone-50 p-3">
                    <dt className="flex items-center gap-1.5 text-sm font-bold text-stone-500">
                      <MoveVertical className="size-4" /> Rolou até
                    </dt>
                    <dd className="mt-0.5 text-lg font-bold text-stone-900">
                      {v.scrollPct}% da página
                    </dd>
                  </div>
                  <div className="rounded-xl bg-stone-50 p-3">
                    <dt className="flex items-center gap-1.5 text-sm font-bold text-stone-500">
                      <MapPin className="size-4" /> Cidade aproximada
                    </dt>
                    <dd className="mt-0.5 text-lg font-bold text-stone-900">
                      {cidade ?? "não identificada"}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-stone-50 p-3">
                    <dt className="flex items-center gap-1.5 text-sm font-bold text-stone-500">
                      <UserRound className="size-4" /> Última ação
                    </dt>
                    <dd className="mt-0.5 text-lg font-bold text-stone-900">
                      {formatRelative(v.lastSeenAt)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4">
                  {acoes.length === 0 ? (
                    <p className="text-base text-stone-500">
                      Só abriu a página — nenhum clique registrado.
                    </p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {acoes.map(({ icon: Icon, texto, forte }) => (
                        <li
                          key={texto}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-base font-semibold",
                            forte
                              ? "bg-gold-100 text-gold-900"
                              : "bg-stone-100 text-stone-700",
                          )}
                        >
                          <Icon className="size-4" /> {texto}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
