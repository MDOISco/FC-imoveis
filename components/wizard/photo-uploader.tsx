"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

/** Área de upload de fotos: clique ou arraste os arquivos para cá. */
export function PhotoUploader({
  uploadUrl,
  onDone,
  maxFiles = 30,
}: {
  uploadUrl: string;
  onDone?: () => void;
  maxFiles?: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [sending, setSending] = useState<null | number>(null);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      toast("Escolha arquivos de imagem (JPG ou PNG).", "erro");
      return;
    }
    if (list.length > maxFiles) {
      toast(`Envie no máximo ${maxFiles} fotos por vez.`, "erro");
      return;
    }
    setSending(list.length);
    try {
      const form = new FormData();
      for (const f of list) form.append("fotos", f);
      const res = await fetch(uploadUrl, { method: "POST", body: form });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        created?: number;
        skipped?: string[];
      } | null;
      if (!res.ok) {
        toast(data?.error ?? "Não foi possível enviar as fotos.", "erro");
      } else {
        toast(
          `${data?.created ?? 0} foto(s) adicionada(s)!` +
            (data?.skipped?.length ? ` (${data.skipped.length} ignorada(s))` : ""),
        );
        data?.skipped?.forEach((msg) => toast(msg, "erro"));
        router.refresh();
        onDone?.();
      }
    } catch {
      toast("Falha no envio. Verifique a internet e tente de novo.", "erro");
    } finally {
      setSending(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Adicionar fotos"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!sending) void upload(e.dataTransfer.files);
      }}
      className={cn(
        "flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-[3px] border-dashed p-6 text-center transition-colors",
        dragging
          ? "border-brand-600 bg-brand-50"
          : "border-stone-300 bg-stone-50 hover:border-brand-500 hover:bg-brand-50/50",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && !sending) void upload(e.target.files);
        }}
      />
      {sending ? (
        <>
          <Spinner className="size-8" />
          <p className="text-lg font-semibold text-stone-700">
            Enviando e tratando {sending} foto(s)…
          </p>
          <p className="text-base text-stone-500">
            Isso pode levar alguns segundos. Não feche a página.
          </p>
        </>
      ) : (
        <>
          <ImagePlus className="size-10 text-brand-600" />
          <p className="text-lg font-semibold text-stone-700">
            Toque aqui para escolher as fotos
          </p>
          <p className="text-base text-stone-500">
            ou arraste os arquivos para esta área · JPG ou PNG, até 15MB cada
          </p>
        </>
      )}
    </div>
  );
}
