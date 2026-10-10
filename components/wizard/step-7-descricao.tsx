"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import type { WizardProperty } from "@/lib/wizard-dto";
import { useStepSave } from "./use-step-save";
import { WizardNav } from "./wizard-nav";

type Suggestions = {
  objetiva: string;
  emocional: string;
  investidor: string;
  origem: "ia" | "template";
};

const STYLE_CARDS = [
  {
    key: "OBJETIVA",
    field: "objetiva" as const,
    label: "Objetiva e completa",
    help: "Direto ao ponto, com todos os dados.",
  },
  {
    key: "EMOCIONAL",
    field: "emocional" as const,
    label: "Acolhedora",
    help: "Fala ao coração de quem procura um lar.",
  },
  {
    key: "INVESTIDOR",
    field: "investidor" as const,
    label: "Para investidor",
    help: "Foca em números e oportunidade.",
  },
];

export function Step7Descricao({
  property,
}: {
  property: WizardProperty;
  step?: number;
}) {
  const { save, saving, savedAt } = useStepSave(property.id);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [regen, setRegen] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(
    property.descriptionStyle,
  );
  const [text, setText] = useState(property.description ?? "");
  const [error, setError] = useState<string | null>(null);

  async function fetchSuggestions(nextRegen: number) {
    setLoading(true);
    try {
      const data = await apiFetch<Suggestions>(
        `/api/imoveis/${property.id}/descricoes`,
        { method: "POST", body: { regen: nextRegen } },
      );
      setSuggestions(data);
    } catch (e) {
      toast(
        e instanceof ApiError
          ? e.message
          : "Não foi possível gerar as sugestões.",
        "erro",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchSuggestions(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choose(styleKey: string, content: string) {
    setSelectedStyle(styleKey);
    setText(content);
    setError(null);
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!text.trim()) {
          setError(
            "Escolha uma das sugestões abaixo ou escreva a sua própria descrição.",
          );
          return;
        }
        await save(
          { description: text, descriptionStyle: selectedStyle ?? "PROPRIA" },
          7,
          { goTo: 8 },
        );
      }}
      className="space-y-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-900">
            3 sugestões prontas para você escolher
          </h2>
          <p className="mt-1 text-base text-stone-600">
            Toque em uma sugestão para usá-la. Depois é só ajustar o texto se
            quiser.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {suggestions && (
            <Badge
              className={
                suggestions.origem === "ia"
                  ? "bg-purple-100 text-purple-900"
                  : "bg-stone-200 text-stone-700"
              }
            >
              {suggestions.origem === "ia" ? (
                <>
                  <Sparkles className="size-4" /> Geradas por IA
                </>
              ) : (
                "Geradas automaticamente"
              )}
            </Badge>
          )}
          <Button
            variant="secondary"
            disabled={loading}
            onClick={() => {
              const next = regen + 1;
              setRegen(next);
              void fetchSuggestions(next);
            }}
          >
            <RefreshCw className={cn("size-5", loading && "animate-spin")} />
            Gerar novamente
          </Button>
        </div>
      </div>

      {loading && !suggestions ? (
        <div className="flex min-h-40 items-center justify-center gap-3 text-lg text-stone-500">
          <Spinner className="size-7" /> Escrevendo as sugestões…
        </div>
      ) : suggestions ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {STYLE_CARDS.map((card) => {
            const content = suggestions[card.field];
            const selected = selectedStyle === card.key;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => choose(card.key, content)}
                className={cn(
                  "flex flex-col rounded-2xl border-2 p-4 text-left transition-colors",
                  selected
                    ? "border-brand-600 bg-brand-50"
                    : "border-stone-200 bg-white hover:border-brand-300",
                  loading && "opacity-60",
                )}
                aria-pressed={selected}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full border-2",
                      selected
                        ? "border-brand-700 bg-brand-700 text-white"
                        : "border-stone-300",
                    )}
                  >
                    {selected && "✓"}
                  </span>
                  <span className="text-lg font-bold text-stone-900">
                    {card.label}
                  </span>
                </span>
                <span className="mt-0.5 text-sm text-stone-500">
                  {card.help}
                </span>
                <span className="mt-3 max-h-56 overflow-y-auto whitespace-pre-line rounded-lg bg-white/60 p-2 text-sm leading-relaxed text-stone-700">
                  {content}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <Field
        label="Descrição escolhida (pode editar à vontade)"
        error={error ?? undefined}
        htmlFor="descricao"
      >
        <Textarea
          id="descricao"
          rows={10}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          placeholder="Toque em uma das sugestões acima, ou escreva aqui a sua própria descrição…"
        />
      </Field>

      <WizardNav
        propertyId={property.id}
        step={7}
        saving={saving}
        savedAt={savedAt}
        onSaveDraft={async () => {
          const ok = await save(
            {
              description: text,
              descriptionStyle: text ? (selectedStyle ?? "PROPRIA") : null,
            },
            7,
          );
          if (ok) toast("Rascunho salvo!");
        }}
      />
    </form>
  );
}
