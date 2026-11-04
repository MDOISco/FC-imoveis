"use client";

import { useState } from "react";
import { CheckboxField } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/toast";
import { DOCUMENTOS_IMOVEL } from "@/lib/constants";
import { apiFetch, ApiError } from "@/lib/client-api";

/**
 * Checklist de documentos do imóvel (matrícula, IPTU…), salvo na hora a cada
 * clique. É anotação interna da equipe: nunca aparece em anúncio ou feed.
 */
export function DocumentosChecklist({
  propertyId,
  marcadosIniciais,
}: {
  propertyId: string;
  marcadosIniciais: string[];
}) {
  const [marcados, setMarcados] = useState<Set<string>>(
    new Set(marcadosIniciais),
  );
  const [busy, setBusy] = useState(false);

  async function alternar(chave: string) {
    const anterior = new Set(marcados);
    const proximo = new Set(marcados);
    if (proximo.has(chave)) proximo.delete(chave);
    else proximo.add(chave);
    setMarcados(proximo); // otimista: marca na hora, desfaz se falhar
    setBusy(true);
    try {
      await apiFetch(`/api/imoveis/${propertyId}`, {
        method: "PATCH",
        body: { docsChecklist: [...proximo] },
      });
    } catch (e) {
      setMarcados(anterior);
      toast(
        e instanceof ApiError ? e.message : "Não foi possível salvar.",
        "erro",
      );
    } finally {
      setBusy(false);
    }
  }

  const total = DOCUMENTOS_IMOVEL.length;
  const feitos = DOCUMENTOS_IMOVEL.filter((d) => marcados.has(d.value)).length;
  const completo = feitos === total;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${Math.round((feitos / total) * 100)}%` }}
          />
        </div>
        <span
          className={`shrink-0 text-base font-bold ${completo ? "text-brand-700" : "text-stone-600"}`}
        >
          {feitos} de {total}
        </span>
      </div>
      <div className="space-y-2">
        {DOCUMENTOS_IMOVEL.map((d) => (
          <CheckboxField
            key={d.value}
            label={d.label}
            help={d.help}
            checked={marcados.has(d.value)}
            disabled={busy}
            onChange={() => alternar(d.value)}
          />
        ))}
      </div>
      <p className="text-sm text-stone-500">
        🔒 Anotação interna da equipe — não aparece em anúncios nem no site.
        Nem todo item se aplica a todo imóvel.
      </p>
    </div>
  );
}
