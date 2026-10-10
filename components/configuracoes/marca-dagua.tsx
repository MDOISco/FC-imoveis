"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { RadioCards } from "@/components/ui/radio-cards";
import { Spinner } from "@/components/ui/spinner";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";

export function MarcaDagua({
  logoPath,
  initial,
}: {
  logoPath: string | null;
  initial: {
    watermarkDefault: boolean;
    watermarkPosition: string;
    watermarkOpacity: number;
  };
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState<"logo" | "salvar" | null>(null);

  async function reprocess() {
    const result = await apiFetch<{ total: number; failures: number }>(
      "/api/configuracoes/reprocessar",
      { method: "POST" },
    );
    if (result.failures > 0) {
      toast(
        `${result.total - result.failures} foto(s) atualizadas; ${result.failures} falharam.`,
        "erro",
      );
    } else if (result.total > 0) {
      toast(`${result.total} foto(s) atualizadas com a nova marca d'água!`);
    }
    router.refresh();
  }

  async function uploadLogo(file: File) {
    setBusy("logo");
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch("/api/configuracoes/logo", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        toast(data?.error ?? "Não foi possível enviar o logo.", "erro");
        return;
      }
      toast("Logo atualizado! Atualizando as fotos…");
      await reprocess();
    } catch {
      toast("Falha no envio do logo.", "erro");
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    setBusy("salvar");
    try {
      await apiFetch("/api/configuracoes", { method: "PATCH", body: form });
      toast("Configurações salvas! Atualizando as fotos…");
      await reprocess();
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Não foi possível salvar.",
        "erro",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-xl space-y-7">
      <Field
        label="Logo da imobiliária"
        help="Usado como marca d'água nas fotos. PNG com fundo transparente fica melhor. Sem logo, usamos o nome da imobiliária em texto."
      >
        <div className="flex items-center gap-4">
          {logoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/arquivos/${logoPath}?v=${Date.now()}`}
              alt="Logo atual"
              className="h-20 max-w-48 rounded-xl border-2 border-stone-200 bg-[repeating-conic-gradient(#f5f5f4_0_25%,#fff_0_50%)] bg-[length:16px_16px] object-contain p-2"
            />
          ) : (
            <p className="text-stone-400">Nenhum logo enviado.</p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadLogo(f);
              e.target.value = "";
            }}
          />
          <Button
            variant="secondary"
            disabled={busy !== null}
            onClick={() => inputRef.current?.click()}
          >
            {busy === "logo" ? (
              <Spinner />
            ) : (
              <>
                <ImageUp className="size-5" />
                {logoPath ? "Trocar logo" : "Enviar logo"}
              </>
            )}
          </Button>
        </div>
      </Field>

      <Toggle
        checked={form.watermarkDefault}
        onChange={(v) => setForm((f) => ({ ...f, watermarkDefault: v }))}
        label="Aplicar marca d'água nas fotos novas"
        help="Cada foto também pode ligar/desligar individualmente."
      />

      <Field label="Posição da marca d'água">
        <RadioCards
          name="watermarkPosition"
          options={[
            { value: "CANTO", label: "Canto inferior direito" },
            { value: "CENTRO", label: "Centro da foto" },
          ]}
          value={form.watermarkPosition}
          onChange={(v) => setForm((f) => ({ ...f, watermarkPosition: v }))}
        />
      </Field>

      <Field
        label={`Transparência: ${Math.round(form.watermarkOpacity * 100)}%`}
        help="Quanto menor, mais discreta a marca d'água."
      >
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={Math.round(form.watermarkOpacity * 100)}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              watermarkOpacity: Number(e.target.value) / 100,
            }))
          }
          className="h-3 w-full cursor-pointer accent-brand-700"
        />
      </Field>

      <div className="rounded-xl bg-amber-50 p-4 text-base text-amber-900">
        Ao salvar, <strong>todas as fotos já cadastradas</strong> são
        atualizadas com a nova marca d'água (a partir dos arquivos originais).
        Isso pode levar alguns minutos.
      </div>

      <Button size="lg" disabled={busy !== null} onClick={save}>
        {busy === "salvar" ? (
          <>
            <Spinner className="border-white/40 border-t-white" /> Atualizando
            fotos…
          </>
        ) : (
          "Salvar e atualizar as fotos"
        )}
      </Button>
    </div>
  );
}
