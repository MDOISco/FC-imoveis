import Link from "next/link";
import { CalendarX2 } from "lucide-react";
import { CancelarCard } from "@/components/agenda/cancelar-card";
import { Badge } from "@/components/ui/badge";
import { tituloPublico } from "@/lib/agenda/ics";
import { formatarDataHoraSP } from "@/lib/agenda/slots";
import {
  APPOINTMENT_STATUS_BADGE_CLASSES,
  APPOINTMENT_STATUSES,
  labelOf,
} from "@/lib/constants";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Cancelar visita · FC Imóveis" };

/** Página pública do link privado de cancelamento do cliente. */
export default async function CancelarPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ap = await db.appointment.findUnique({
    where: { cancelToken: token },
    include: { property: true, broker: true },
  });

  if (!ap) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-3xl border border-stone-200 bg-white p-7 text-center">
        <CalendarX2 className="mx-auto size-12 text-stone-400" />
        <h1 className="text-2xl font-extrabold text-stone-900">
          Agendamento não encontrado
        </h1>
        <p className="text-lg text-stone-600">
          Confira se o link está completo. Se precisar, agende de novo.
        </p>
        <Link
          href="/agendar"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-700 px-6 font-semibold text-white hover:bg-brand-800"
        >
          Fazer um novo agendamento
        </Link>
      </div>
    );
  }

  const quando = formatarDataHoraSP(ap.startsAt);
  const podeCancelar = ap.status === "AGENDADO" || ap.status === "CONFIRMADO";

  return (
    <div className="mx-auto max-w-lg space-y-5 rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-extrabold text-stone-900">
          Seu agendamento
        </h1>
        <Badge className={APPOINTMENT_STATUS_BADGE_CLASSES[ap.status]}>
          {labelOf(APPOINTMENT_STATUSES, ap.status)}
        </Badge>
      </div>

      <dl className="divide-y divide-stone-100 rounded-2xl border-2 border-stone-200 px-4">
        {(
          [
            ["O quê", tituloPublico(ap.property)],
            ["Quando", quando],
            ["Quem recebe você", ap.broker?.name ?? "Equipe FC Imóveis"],
            ["Em nome de", ap.name],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-3">
            <dt className="font-semibold text-stone-500">{label}</dt>
            <dd className="text-right font-semibold text-stone-900">{value}</dd>
          </div>
        ))}
      </dl>

      {podeCancelar ? (
        <>
          <a
            href={`/api/agenda/ics/${token}`}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-stone-300 bg-white px-5 font-semibold text-stone-800 hover:border-brand-600"
          >
            📅 Baixar lembrete para meu calendário
          </a>
          <CancelarCard token={token} quando={quando} />
        </>
      ) : (
        <p className="rounded-2xl bg-stone-100 px-5 py-4 text-center text-lg text-stone-700">
          {ap.status === "CANCELADO"
            ? "Esta visita já foi cancelada. Se mudar de ideia, é só agendar de novo."
            : "Esta visita já foi realizada. Obrigado!"}
        </p>
      )}

      <p className="text-center text-sm text-stone-500">
        Por segurança, o endereço exato é combinado com a nossa equipe.
      </p>
    </div>
  );
}
