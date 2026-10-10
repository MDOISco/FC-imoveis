"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";

export function ApiKeyField({ masked }: { masked: string | null }) {
  const [currentMasked, setCurrentMasked] = useState(masked);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(key: string | null) {
    setSaving(true);
    try {
      const res = await apiFetch<{ anthropicApiKeyMasked: string | null }>(
        "/api/configuracoes",
        { method: "PATCH", body: { anthropicApiKey: key } },
      );
      setCurrentMasked(res.anthropicApiKeyMasked);
      setValue("");
      toast(
        key
          ? "Chave salva! As descrições agora são geradas por IA."
          : "Chave removida. As descrições voltam ao modo automático.",
      );
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Não foi possível salvar.",
        "erro",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-start gap-3 rounded-xl bg-purple-50 p-4 text-base text-purple-900">
        <Sparkles className="mt-0.5 size-5 shrink-0" />
        <p>
          Com uma chave da API do Claude (Anthropic), as 3 sugestões de
          descrição passam a ser escritas por inteligência artificial, com
          textos mais naturais. <strong>Sem a chave, tudo continua
          funcionando</strong> com as descrições automáticas.
        </p>
      </div>

      {currentMasked && (
        <p className="text-base text-stone-600">
          Chave configurada: <code className="rounded bg-stone-100 px-2 py-1 font-mono">{currentMasked}</code>
        </p>
      )}

      <Field
        label={currentMasked ? "Trocar a chave" : "Chave da API (sk-ant-…)"}
        htmlFor="apiKey"
        help="A chave fica guardada apenas neste sistema e nunca aparece por inteiro."
      >
        <Input
          id="apiKey"
          type="password"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Cole a chave aqui"
        />
      </Field>

      <div className="flex gap-3">
        <Button disabled={saving || !value.trim()} onClick={() => save(value.trim())}>
          Salvar chave
        </Button>
        {currentMasked && (
          <Button
            variant="secondary"
            disabled={saving}
            onClick={() => save(null)}
          >
            Remover chave
          </Button>
        )}
      </div>
    </div>
  );
}
