"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import type { WizardVideo } from "@/lib/wizard-dto";

const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const ACCEPTED = ["video/mp4", "video/quicktime", "video/x-m4v"];

/** Upload do vídeo com barra de progresso (XHR PUT em stream). */
export function VideoUploader({
  videoUrl, // /api/imoveis/{id}/video (ou rota pública equivalente)
  video,
}: {
  videoUrl: string;
  video: WizardVideo | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  function upload(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      toast("Formato não aceito. Envie um vídeo MP4 ou MOV.", "erro");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast("O vídeo passa de 200MB. Corte ou diminua a qualidade.", "erro");
      return;
    }
    const xhr = new XMLHttpRequest();
    const url = `${videoUrl}?nome=${encodeURIComponent(file.name)}`;
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      setProgress(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        toast("Vídeo enviado!");
        router.refresh();
      } else {
        let msg = "Não foi possível enviar o vídeo.";
        try {
          msg = JSON.parse(xhr.responseText).error ?? msg;
        } catch {}
        toast(msg, "erro");
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      toast("Falha no envio do vídeo. Verifique a internet.", "erro");
    };
    setProgress(0);
    xhr.send(file);
  }

  async function remove() {
    if (!window.confirm("Excluir o vídeo deste imóvel?")) return;
    try {
      await apiFetch(videoUrl, { method: "DELETE" });
      toast("Vídeo excluído.");
      router.refresh();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Não foi possível excluir.", "erro");
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />

      {video ? (
        <div className="space-y-3">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            controls
            preload="metadata"
            className="max-h-80 w-full rounded-2xl border border-stone-200 bg-black"
            src={`/api/arquivos/${video.path}`}
          />
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-base text-stone-600">
              {video.originalName ?? "vídeo"} ·{" "}
              {(video.sizeBytes / (1024 * 1024)).toFixed(0)}MB
            </p>
            <Button variant="secondary" onClick={() => inputRef.current?.click()}>
              Trocar vídeo
            </Button>
            <Button variant="danger" onClick={remove}>
              <Trash2 className="size-5" /> Excluir
            </Button>
          </div>
        </div>
      ) : progress === null ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-[3px] border-dashed border-stone-300 bg-stone-50 p-6 text-center transition-colors hover:border-brand-500 hover:bg-brand-50/50"
        >
          <Video className="size-9 text-brand-600" />
          <span className="text-lg font-semibold text-stone-700">
            Toque para escolher o vídeo
          </span>
          <span className="text-base text-stone-500">
            MP4 ou MOV, até 200MB
          </span>
        </button>
      ) : null}

      {progress !== null && (
        <div>
          <div className="mb-1.5 flex justify-between text-base font-semibold text-stone-700">
            <span>Enviando vídeo…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-sm text-stone-500">
            Não feche a página durante o envio.
          </p>
        </div>
      )}
    </div>
  );
}
