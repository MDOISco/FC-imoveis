"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import { PORTAL_FEEDS } from "@/lib/constants";

export function FeedUrls({
  initialBaseUrl,
  fallbackBaseUrl,
}: {
  initialBaseUrl: string;
  fallbackBaseUrl: string;
}) {
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl);
  const [saving, setSaving] = useState(false);
  const effective = (baseUrl || fallbackBaseUrl).replace(/\/$/, "");
  const isLocal =
    effective.includes("localhost") || effective.includes("127.0.0.1");

  return (
    <div className="max-w-2xl space-y-7">
      <p className="text-base text-stone-600">
        A publicação nos portais é <strong>automática por feed</strong>: você
        cadastra cada endereço abaixo UMA vez no painel do portal, e ele passa a
        ler os imóveis ativos sozinho — sem redigitar nada.
      </p>

      <Field
        label="Endereço público do sistema"
        help="O endereço (domínio) onde este sistema fica acessível na internet. Os portais usam este endereço para ler o feed e baixar as fotos."
        htmlFor="publicBaseUrl"
      >
        <div className="flex gap-2">
          <Input
            id="publicBaseUrl"
            value={baseUrl}
            placeholder="https://sistema.fcimoveis.com.br"
            onChange={(e) => setBaseUrl(e.target.value)}
          />
          <Button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await apiFetch("/api/configuracoes", {
                  method: "PATCH",
                  body: { publicBaseUrl: baseUrl || null },
                });
                toast("Endereço salvo!");
              } catch (err) {
                toast(
                  err instanceof ApiError
                    ? err.message
                    : "Não foi possível salvar.",
                  "erro",
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            Salvar
          </Button>
        </div>
      </Field>

      {isLocal && (
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-base text-amber-900">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          O endereço atual é local (localhost) — os portais NÃO conseguem
          acessá-lo. Quando o sistema estiver publicado na internet, salve aqui
          o endereço definitivo.
        </p>
      )}

      <div className="space-y-5">
        {PORTAL_FEEDS.map((feed) => {
          const url = `${effective}${feed.path}`;
          return (
            <div
              key={feed.key}
              className="rounded-2xl border-2 border-stone-200 bg-white p-5"
            >
              <h3 className="text-lg font-bold text-stone-900">{feed.label}</h3>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-stone-100 px-3 py-2.5 font-mono text-sm text-stone-700">
                  {url}
                </code>
                <CopyButton text={url} />
              </div>
              <ol className="mt-4 space-y-1.5 pl-5 text-base text-stone-600">
                {feed.instructions.map((step, i) => (
                  <li key={i} className="list-decimal">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </div>
  );
}
