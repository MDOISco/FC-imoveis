"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";

function statusText(published: boolean, propertyStatus: string) {
  if (!published) {
    return {
      text: "Fora do site — ninguém vê este imóvel por lá",
      className: "text-stone-500",
    };
  }
  if (propertyStatus !== "ATIVO") {
    return {
      text: "Aparecerá no site quando o imóvel estiver ativo",
      className: "text-amber-700",
    };
  }
  return {
    text: "No ar — com página própria no site",
    className: "text-brand-700",
  };
}

/** Liga/desliga a vitrine e a página pública do imóvel no site. */
export function SitePublicacao({
  propertyId,
  publishedOnSite,
  propertyStatus,
  publicUrl,
}: {
  propertyId: string;
  publishedOnSite: boolean;
  propertyStatus: string;
  publicUrl: string; // URL absoluta da página pública (para copiar/enviar)
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const st = statusText(publishedOnSite, propertyStatus);
  const noAr = publishedOnSite && propertyStatus === "ATIVO";

  async function setPublished(v: boolean) {
    setBusy(true);
    try {
      await apiFetch(`/api/imoveis/${propertyId}`, {
        method: "PATCH",
        body: { publishedOnSite: v },
      });
      router.refresh();
    } catch (e) {
      toast(
        e instanceof ApiError ? e.message : "Não foi possível salvar.",
        "erro",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-stone-200 bg-white px-4 py-3">
        <Toggle
          checked={publishedOnSite}
          disabled={busy}
          onChange={setPublished}
          label="Publicar no site"
        />
        <span className={`text-base font-semibold ${st.className}`}>
          {st.text}
        </span>
      </div>
      {noAr && (
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-stone-300 bg-white px-5 font-semibold text-stone-800 hover:border-brand-600 hover:text-brand-800"
          >
            <ExternalLink className="size-5" /> Abrir página no site
          </a>
          <CopyButton text={publicUrl} label="Copiar link da página" />
        </div>
      )}
      <p className="text-sm text-stone-500">
        Só o que estiver ligado aqui aparece no site público — assim nenhum
        imóvel vai ao ar por engano. Os portais (Canal Pro etc.) têm o controle
        próprio logo abaixo.
      </p>
    </div>
  );
}
