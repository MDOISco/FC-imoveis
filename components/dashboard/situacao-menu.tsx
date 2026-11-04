"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import { cn } from "@/lib/cn";

type Opcao = { status: string; rotulo: string; mensagem: string };

const REATIVAR: Opcao = {
  status: "ATIVO",
  rotulo: "Reativar anúncio",
  mensagem: "Imóvel reativado e de volta aos anúncios.",
};
const VENDIDO: Opcao = {
  status: "VENDIDO",
  rotulo: "Marcar vendido",
  mensagem: "Parabéns pela venda! 🎉",
};
const ALUGADO: Opcao = {
  status: "ALUGADO",
  rotulo: "Marcar alugado",
  mensagem: "Parabéns pela locação! 🎉",
};

// Mesmas transições e mensagens do StatusActions da ficha.
const OPCOES: Record<string, Opcao[]> = {
  ATIVO: [
    { status: "RESERVADO", rotulo: "Reservar", mensagem: "Imóvel reservado." },
    VENDIDO,
    ALUGADO,
    {
      status: "DESATIVADO",
      rotulo: "Desativar",
      mensagem: "Imóvel desativado (sai dos anúncios).",
    },
  ],
  RESERVADO: [REATIVAR, VENDIDO, ALUGADO],
  VENDIDO: [REATIVAR],
  ALUGADO: [REATIVAR],
  DESATIVADO: [REATIVAR],
};

/**
 * Muda a situação do imóvel (Reservado, Vendido…) direto do painel, sem
 * abrir a ficha. Abre a lista "para baixo", no fluxo do card (nada de menu
 * flutuante: o card tem overflow-hidden e cortaria).
 */
export function SituacaoMenu({
  propertyId,
  status,
  compact = false,
}: {
  propertyId: string;
  status: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [busy, setBusy] = useState(false);
  const opcoes = OPCOES[status];
  if (!opcoes) return null;

  async function mudar(opcao: Opcao) {
    setBusy(true);
    try {
      await apiFetch(`/api/imoveis/${propertyId}`, {
        method: "PATCH",
        body: { status: opcao.status },
      });
      toast(opcao.mensagem);
      setAberto(false);
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError) {
        const pend = (e.details as { pendencias?: string[] })?.pendencias;
        toast(pend?.length ? `${e.message} ${pend[0]}` : e.message, "erro");
      } else {
        toast("Não foi possível mudar a situação.", "erro");
      }
    } finally {
      setBusy(false);
    }
  }

  const Seta = aberto ? ChevronUp : ChevronDown;

  return (
    <div className={compact ? "relative" : undefined}>
      <button
        type="button"
        disabled={busy}
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border-2 border-stone-200 bg-white font-semibold text-stone-700 transition-colors hover:border-brand-500 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-50",
          compact ? "min-h-11 px-4" : "min-h-12 w-full px-5 text-base",
        )}
      >
        Mudar situação <Seta className="size-5" />
      </button>
      {aberto && (
        <div
          className={cn(
            "flex flex-col gap-1.5 rounded-xl border-2 border-stone-200 bg-white p-1.5 shadow-lg",
            compact
              ? "absolute right-0 top-full z-20 mt-1.5 w-56"
              : "mt-1.5 w-full",
          )}
        >
          {opcoes.map((o) => (
            <button
              key={o.status}
              type="button"
              disabled={busy}
              onClick={() => mudar(o)}
              className="inline-flex min-h-11 items-center rounded-lg px-4 text-left text-base font-semibold text-stone-800 hover:bg-brand-50 hover:text-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {o.rotulo}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
