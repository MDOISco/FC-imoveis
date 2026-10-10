"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import { PORTALS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { WizardPublication } from "@/lib/wizard-dto";

function statusText(
  pub: WizardPublication | undefined,
  propertyStatus: string,
): { text: string; className: string } {
  if (!pub?.enabled) {
    return { text: "Não publicado", className: "text-stone-400" };
  }
  if (propertyStatus !== "ATIVO") {
    return {
      text: "Será publicado quando o imóvel estiver ativo",
      className: "text-amber-700",
    };
  }
  if (pub.firstPublishedAt) {
    return {
      text: `Publicado desde ${formatDate(pub.firstPublishedAt)}`,
      className: "text-brand-700",
    };
  }
  return {
    text: "No feed — aguardando sincronização do portal",
    className: "text-blue-700",
  };
}

/** Liga/desliga cada portal e mostra a situação da publicação. */
export function PortalToggles({
  propertyId,
  publications,
  propertyStatus,
  priceOnRequest,
}: {
  propertyId: string;
  publications: WizardPublication[];
  propertyStatus: string;
  priceOnRequest: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const byPortal = new Map(publications.map((p) => [p.portal, p]));

  async function setEnabled(portal: string, enabled: boolean) {
    setBusy(portal);
    try {
      await apiFetch(`/api/imoveis/${propertyId}/publicacoes`, {
        method: "PUT",
        body: { portals: [{ portal, enabled }] },
      });
      router.refresh();
    } catch (e) {
      toast(
        e instanceof ApiError ? e.message : "Não foi possível salvar.",
        "erro",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {priceOnRequest && (
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-base text-amber-900">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          Este imóvel está com preço <strong>sob consulta</strong> — os portais
          exigem preço, então ele não entra nos feeds enquanto estiver assim.
        </p>
      )}
      {PORTALS.map((portal) => {
        const pub = byPortal.get(portal.value);
        const st = statusText(pub, propertyStatus);
        return (
          <div
            key={portal.value}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-stone-200 bg-white px-4 py-3"
          >
            <Toggle
              checked={pub?.enabled ?? false}
              disabled={busy === portal.value}
              onChange={(v) => setEnabled(portal.value, v)}
              label={portal.label}
            />
            <span className={`text-base font-semibold ${st.className}`}>
              {st.text}
            </span>
          </div>
        );
      })}
      <p className="text-sm text-stone-500">
        A publicação é automática: os portais leem o feed da FC Imóveis
        sozinhos (configurado em Configurações → Portais). Pode levar algumas
        horas até o anúncio aparecer por lá.
      </p>
    </div>
  );
}
