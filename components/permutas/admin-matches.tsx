"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import {
  MATCH_STATUS_BADGE_CLASSES,
  MATCH_STATUSES,
  labelOf,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";

export type MatchSide = {
  label: string; // "FC-0003 · Casa · Jardim América"
  thumb: string | null;
  contactName: string; // lead ou proprietário/carteira
  contactPhone: string;
  isPortfolio: boolean;
};

export type AdminMatchItem = {
  id: string;
  createdAt: string;
  status: string;
  a: MatchSide;
  b: MatchSide;
};

function Side({ side }: { side: MatchSide }) {
  return (
    <div className="flex flex-1 items-center gap-3 rounded-xl bg-stone-50 p-3">
    {side.thumb ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={side.thumb}
        alt=""
        className="size-20 shrink-0 rounded-lg object-cover"
      />
    ) : (
      <div className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-stone-200 text-2xl">
        🏠
      </div>
    )}
      <div className="min-w-0">
        <p className="truncate font-bold text-stone-900">{side.label}</p>
        <p className="text-base text-stone-600">
          {side.isPortfolio ? "Carteira FC · " : "Cliente · "}
          {side.contactName}
        </p>
        <p className="inline-flex items-center gap-1 text-base font-semibold text-brand-800">
          <Phone className="size-4" /> {side.contactPhone || "sem telefone"}
        </p>
      </div>
    </div>
  );
}

/** Matches para a equipe trabalhar — só AQUI os contatos aparecem. */
export function AdminMatches({ items }: { items: AdminMatchItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<KeyRound className="size-12" />}
        title="Nenhum match ainda"
        description="Quando dois lados curtirem a troca, o match aparece aqui com os contatos para a equipe conduzir a negociação."
      />
    );
  }

  return (
    <div className="space-y-4">
      {items.map((m) => (
        <div
          key={m.id}
          className="rounded-2xl border-2 border-gold-300 bg-white p-5"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-lg font-extrabold text-gold-700">
              <KeyRound className="size-5" /> Match de {formatDate(m.createdAt)}
            </p>
            <div className="flex items-center gap-3">
              <Badge className={MATCH_STATUS_BADGE_CLASSES[m.status]}>
                {labelOf(MATCH_STATUSES, m.status)}
              </Badge>
              <Select
                aria-label="Mudar situação do match"
                className="min-h-11 w-52"
                options={MATCH_STATUSES}
                value={m.status}
                disabled={busy === m.id}
                onChange={async (e) => {
                  setBusy(m.id);
                  try {
                    await apiFetch(`/api/permutas/admin/matches/${m.id}`, {
                      method: "PATCH",
                      body: { status: e.target.value },
                    });
                    toast("Situação do match atualizada.");
                    router.refresh();
                  } catch (err) {
                    toast(
                      err instanceof ApiError
                        ? err.message
                        : "Falha ao atualizar.",
                      "erro",
                    );
                  } finally {
                    setBusy(null);
                  }
                }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <Side side={m.a} />
            <span className="flex items-center justify-center text-2xl">⇄</span>
            <Side side={m.b} />
          </div>
        </div>
      ))}
    </div>
  );
}
