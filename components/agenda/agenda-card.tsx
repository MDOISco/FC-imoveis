"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, Check, CheckCheck, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import {
  APPOINTMENT_STATUS_BADGE_CLASSES,
  APPOINTMENT_STATUSES,
  labelOf,
} from "@/lib/constants";

export type AgendamentoItem = {
  id: string;
  horario: string; // "14:00"
  quando: string; // "qua, 15/10 às 14:00"
  nome: string;
  whatsappLabel: string;
  whatsappHref: string | null;
  email: string | null;
  imovelId: string | null;
  imovelLabel: string; // "FC-0001 · Casa — Centro" | "Atendimento na imobiliária"
  corretor: string | null;
  status: string;
  criadoEm: string;
};

/** Card de um agendamento na agenda da equipe, com as ações. */
export function AgendaCard({ item }: { item: AgendamentoItem }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function agir(
    acao: "confirmar" | "cancelar" | "realizada",
    mensagem: string,
  ) {
    setBusy(true);
    try {
      await apiFetch(`/api/agenda/admin/${item.id}`, {
        method: "POST",
        body: { acao },
      });
      toast(mensagem);
      router.refresh();
    } catch (e) {
      toast(
        e instanceof ApiError ? e.message : "Não foi possível atualizar.",
        "erro",
      );
      setBusy(false);
    }
  }

  const aberto = item.status === "AGENDADO" || item.status === "CONFIRMADO";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border-2 border-stone-200 bg-white p-5 lg:flex-row lg:items-center">
      <div className="flex items-center gap-4 lg:w-28 lg:flex-col lg:gap-1">
        <span className="font-display text-3xl font-bold text-brand-900">
          {item.horario}
        </span>
        <Badge className={APPOINTMENT_STATUS_BADGE_CLASSES[item.status]}>
          {labelOf(APPOINTMENT_STATUSES, item.status)}
        </Badge>
      </div>

      <div className="flex-1 space-y-1">
        <p className="text-lg font-bold text-stone-900">{item.nome}</p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-stone-600">
          {item.whatsappHref ? (
            <a
              href={item.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline"
            >
              <MessageCircle className="size-5" /> {item.whatsappLabel}
            </a>
          ) : (
            <span>{item.whatsappLabel}</span>
          )}
          {item.email && <span>{item.email}</span>}
        </p>
        <p className="text-base text-stone-700">
          {item.imovelId ? (
            <Link
              href={`/imoveis/${item.imovelId}`}
              className="font-semibold text-brand-800 hover:underline"
            >
              {item.imovelLabel}
            </Link>
          ) : (
            <span className="font-semibold">{item.imovelLabel}</span>
          )}
          {" · "}
          {item.corretor ? `Corretor: ${item.corretor}` : "Equipe FC"}
        </p>
        <p className="text-sm text-stone-400">
          Agendado pelo site em {item.criadoEm}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        {item.status === "AGENDADO" && (
          <Button
            disabled={busy}
            onClick={() =>
              agir("confirmar", "Visita confirmada! Avise o cliente no WhatsApp.")
            }
          >
            <Check className="size-5" /> Confirmar
          </Button>
        )}
        {aberto && (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => agir("realizada", "Visita marcada como realizada.")}
          >
            <CheckCheck className="size-5" /> Realizada
          </Button>
        )}
        {item.status !== "CANCELADO" && (
          <a
            href={`/api/agenda/admin/${item.id}/ics`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-stone-300 bg-white px-5 font-semibold text-stone-800 transition-colors hover:border-brand-600 hover:text-brand-800"
          >
            <CalendarPlus className="size-5" /> Adicionar ao calendário
          </a>
        )}
        {aberto && (
          <ConfirmButton
            title="Cancelar esta visita?"
            message={`A visita de ${item.nome} (${item.quando}) será cancelada e o horário ficará livre. Se possível, avise o cliente pelo WhatsApp.`}
            confirmLabel="Sim, cancelar visita"
            cancelLabel="Voltar"
            onConfirm={() => agir("cancelar", "Visita cancelada.")}
          >
            Cancelar
          </ConfirmButton>
        )}
      </div>
    </div>
  );
}
