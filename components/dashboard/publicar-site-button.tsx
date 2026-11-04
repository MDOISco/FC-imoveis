"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, EyeOff, Globe } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { apiFetch, ApiError } from "@/lib/client-api";

/**
 * Publica (ou tira do ar) o imóvel no site direto do painel, sem abrir a
 * ficha. Usa o mesmo PATCH do quadro "Site da FC Imóveis" da ficha.
 * Só faz sentido para imóvel ATIVO da imobiliária — quem chama decide isso.
 * `compact` = versão menor para a visão em lista.
 */
export function PublicarSiteButton({
  propertyId,
  publishedOnSite,
  compact = false,
}: {
  propertyId: string;
  publishedOnSite: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  // Mantém o botão travado até a tela re-renderizar com o dado novo
  // (senão, em conexão lenta, daria para clicar de novo antes do refresh).
  const [refreshing, startRefresh] = useTransition();
  const busy = saving || refreshing;

  async function setPublished(v: boolean) {
    setSaving(true);
    try {
      await apiFetch(`/api/imoveis/${propertyId}`, {
        method: "PATCH",
        body: { publishedOnSite: v },
      });
      toast(
        v
          ? "Pronto: o imóvel está no ar no site."
          : "O imóvel saiu do site. Para voltar, é só publicar de novo.",
      );
      startRefresh(() => router.refresh());
    } catch (e) {
      toast(
        e instanceof ApiError ? e.message : "Não foi possível salvar.",
        "erro",
      );
    } finally {
      setSaving(false);
    }
  }

  // Ainda fora do site: botão grande e direto de publicar.
  if (!publishedOnSite) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => setPublished(true)}
        className={
          compact
            ? "inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand-700 px-4 font-semibold text-white shadow-sm hover:bg-brand-800 active:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
            : cn(
                buttonClasses("primary", "md"),
                "w-full disabled:cursor-not-allowed disabled:opacity-50",
              )
        }
      >
        <Globe className="size-5" />
        {busy ? "Publicando…" : "Publicar no site"}
      </button>
    );
  }

  // Já está no ar: mostra o estado e deixa ver a página ou tirar do site.
  return (
    <div
      className={
        compact
          ? "flex items-center gap-2"
          : "flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2"
      }
    >
      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-800">
        <CheckCircle2 className="size-5 shrink-0" /> No ar no site
      </span>
      <span className="flex items-center gap-2">
        <a
          href={`/imovel/${propertyId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-lg px-3 text-base font-semibold text-brand-800 underline underline-offset-2 hover:text-brand-950"
        >
          Ver página
        </a>
        <button
          type="button"
          disabled={busy}
          onClick={() => setPublished(false)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 text-base font-semibold text-stone-600 hover:border-amber-500 hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <EyeOff className="size-4" />
          {busy ? "Salvando…" : "Tirar do site"}
        </button>
      </span>
    </div>
  );
}
