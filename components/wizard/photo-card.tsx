"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, RotateCw, Star, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import type { WizardPhoto } from "@/lib/wizard-dto";

export function PhotoCard({
  photo,
  patchUrl,
  dragHandleProps,
  dragging,
}: {
  photo: WizardPhoto;
  patchUrl: string; // /api/imoveis/{id}/fotos/{fotoId}
  dragHandleProps?: Record<string, unknown>;
  dragging?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [caption, setCaption] = useState(photo.caption ?? "");

  async function patch(body: Record<string, unknown>, successMsg?: string) {
    setBusy(true);
    try {
      await apiFetch(patchUrl, { method: "PATCH", body });
      if (successMsg) toast(successMsg);
      router.refresh();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Não foi possível salvar.", "erro");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Excluir esta foto? Essa ação não tem volta.")) return;
    setBusy(true);
    try {
      await apiFetch(patchUrl, { method: "DELETE" });
      toast("Foto excluída.");
      router.refresh();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Não foi possível excluir.", "erro");
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-sm",
        photo.isCover ? "border-gold-400" : "border-stone-200",
        dragging && "opacity-80 shadow-xl",
      )}
    >
      <div className="relative aspect-[4/3] bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/arquivos/${photo.thumbPath}?v=${photo.version}`}
          alt={caption || "Foto do imóvel"}
          className="size-full object-cover"
          draggable={false}
        />
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Spinner className="size-8" />
          </div>
        )}
        <button
          type="button"
          aria-label="Arrastar para reordenar"
          className="absolute left-2 top-2 flex size-10 cursor-grab items-center justify-center rounded-xl bg-black/50 text-white active:cursor-grabbing"
          {...dragHandleProps}
        >
          <GripVertical className="size-5" />
        </button>
        {photo.isCover && (
          <span className="absolute right-2 top-2 rounded-full bg-gold-400 px-3 py-1 text-sm font-bold text-gold-950">
            ★ Capa
          </span>
        )}
      </div>

      <div className="space-y-3 p-3">
        <input
          type="text"
          value={caption}
          maxLength={200}
          placeholder="Legenda (opcional)"
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => {
            if ((photo.caption ?? "") !== caption) {
              void patch({ caption });
            }
          }}
          className="w-full rounded-lg border-2 border-stone-200 px-3 py-2 text-base focus:border-brand-600 focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          {!photo.isCover && (
            <button
              type="button"
              disabled={busy}
              onClick={() => patch({ isCover: true }, "Definida como capa!")}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-stone-100 px-3 text-sm font-semibold text-stone-700 hover:bg-gold-100 hover:text-gold-900"
            >
              <Star className="size-4" /> Tornar capa
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => patch({ rotate90: true })}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-stone-100 px-3 text-sm font-semibold text-stone-700 hover:bg-stone-200"
          >
            <RotateCw className="size-4" /> Girar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={remove}
            className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-red-50 px-3 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            <Trash2 className="size-4" /> Excluir
          </button>
        </div>
        <div className="flex flex-col gap-2 border-t border-stone-100 pt-3">
          <Toggle
            checked={photo.enhance}
            disabled={busy}
            onChange={(v) => patch({ enhance: v })}
            label="Tratamento automático"
          />
          <Toggle
            checked={photo.watermark}
            disabled={busy}
            onChange={(v) => patch({ watermark: v })}
            label="Marca d'água"
          />
        </div>
      </div>
    </div>
  );
}
