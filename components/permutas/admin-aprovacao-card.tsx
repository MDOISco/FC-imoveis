"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Phone, RefreshCw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import { cn } from "@/lib/cn";

export type AprovacaoItem = {
  id: string;
  refCode: string;
  typeLabel: string;
  location: string;
  specs: string;
  valueLabel: string;
  leadDescription: string;
  leadName: string;
  leadWhatsapp: string;
  leadEmail: string | null;
  preferenceSummary: string;
  photos: Array<{ thumbUrl: string }>;
  createdAt: string;
};

type Suggestions = {
  objetiva: string;
  emocional: string;
  investidor: string;
  origem: "ia" | "template";
};

const STYLE_LABELS: Array<{ key: string; field: keyof Suggestions; label: string }> = [
  { key: "OBJETIVA", field: "objetiva", label: "Objetiva" },
  { key: "EMOCIONAL", field: "emocional", label: "Acolhedora" },
  { key: "INVESTIDOR", field: "investidor", label: "Investidor" },
];

export function AdminAprovacaoCard({ item }: { item: AprovacaoItem }) {
  const router = useRouter();
  const [description, setDescription] = useState(item.leadDescription);
  const [style, setStyle] = useState("PROPRIA");
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [loadingSug, setLoadingSug] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function generate() {
    setLoadingSug(true);
    try {
      const data = await apiFetch<Suggestions>(
        `/api/imoveis/${item.id}/descricoes`,
        { method: "POST", body: { regen: Math.floor(Math.random() * 1000) } },
      );
      setSuggestions(data);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Falha ao gerar.", "erro");
    } finally {
      setLoadingSug(false);
    }
  }

  async function approve() {
    setBusy(true);
    try {
      await apiFetch(`/api/permutas/admin/aprovacoes/${item.id}`, {
        method: "POST",
        body: { action: "aprovar", description, descriptionStyle: style },
      });
      toast(`${item.refCode} aprovado e publicado nas permutas!`);
      router.refresh();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Falha ao aprovar.", "erro");
      setBusy(false);
    }
  }

  async function reject() {
    setBusy(true);
    try {
      await apiFetch(`/api/permutas/admin/aprovacoes/${item.id}`, {
        method: "POST",
        body: { action: "reprovar", rejectionReason: reason },
      });
      toast(`${item.refCode} reprovado. O cliente vê o motivo no painel dele.`);
      router.refresh();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Falha ao reprovar.", "erro");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-stone-400">
            {item.refCode} · enviado em {item.createdAt}
          </p>
          <h3 className="text-xl font-bold text-stone-900">
            {item.typeLabel} · {item.location}
          </h3>
          <p className="text-base text-stone-600">
            {item.specs} · {item.valueLabel}
          </p>
        </div>
        <div className="rounded-xl bg-stone-50 px-4 py-2.5 text-base">
          <p className="font-bold text-stone-800">{item.leadName}</p>
          <p className="inline-flex items-center gap-1.5 text-stone-600">
            <Phone className="size-4" /> {item.leadWhatsapp}
            {item.leadEmail && ` · ${item.leadEmail}`}
          </p>
        </div>
      </div>

      {item.photos.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {item.photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={p.thumbUrl}
              alt={`Foto ${i + 1}`}
              className="h-24 w-32 shrink-0 rounded-xl border border-stone-200 object-cover"
            />
          ))}
        </div>
      )}

      <p className="mt-4 rounded-xl bg-gold-50 px-4 py-3 text-base text-gold-900">
        <strong>Procura na troca:</strong> {item.preferenceSummary}
      </p>

      <div className="mt-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-lg font-bold text-stone-900">
            Descrição do anúncio
          </h4>
          <Button variant="secondary" disabled={loadingSug} onClick={generate}>
            {suggestions ? (
              <RefreshCw className={cn("size-5", loadingSug && "animate-spin")} />
            ) : (
              <Sparkles className="size-5" />
            )}
            {suggestions ? "Gerar novamente" : "Gerar 3 sugestões"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setStyle("PROPRIA");
              setDescription(item.leadDescription);
            }}
            className={cn(
              "min-h-11 rounded-xl border-2 px-4 font-semibold",
              style === "PROPRIA"
                ? "border-brand-600 bg-brand-50 text-brand-900"
                : "border-stone-200 bg-white text-stone-600 hover:border-brand-300",
            )}
          >
            Texto do cliente
          </button>
          {suggestions &&
            STYLE_LABELS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  setStyle(s.key);
                  setDescription(String(suggestions[s.field]));
                }}
                className={cn(
                  "min-h-11 rounded-xl border-2 px-4 font-semibold",
                  style === s.key
                    ? "border-brand-600 bg-brand-50 text-brand-900"
                    : "border-stone-200 bg-white text-stone-600 hover:border-brand-300",
                )}
              >
                {s.label}
                {suggestions.origem === "ia" && " ✨"}
              </button>
            ))}
        </div>

        <Textarea
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Descrição final do anúncio"
        />

        {rejecting ? (
          <div className="space-y-3 rounded-xl bg-red-50 p-4">
            <Field
              label="Motivo da reprovação (o cliente vê esta mensagem)"
              htmlFor={`motivo-${item.id}`}
            >
              <Textarea
                id={`motivo-${item.id}`}
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex.: As fotos estão escuras — pode enviar novas?"
              />
            </Field>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setRejecting(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                disabled={busy || !reason.trim()}
                onClick={reject}
              >
                Confirmar reprovação
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button size="lg" disabled={busy} onClick={approve}>
              <Check className="size-5" /> Aprovar e publicar
            </Button>
            <Button
              variant="secondary"
              size="lg"
              disabled={busy}
              onClick={() => setRejecting(true)}
            >
              <X className="size-5" /> Reprovar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
