"use client";

import { useState } from "react";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { WizardPhoto, WizardVideo } from "@/lib/wizard-dto";

/** Galeria da ficha: foto grande + miniaturas + lightbox + vídeo. */
export function Galeria({
  photos,
  video,
  title,
}: {
  photos: WizardPhoto[];
  video: WizardVideo | null;
  title: string;
}) {
  const ordered = [...photos].sort(
    (a, b) => Number(b.isCover) - Number(a.isCover) || a.position - b.position,
  );
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const current = ordered[index];

  if (ordered.length === 0 && !video) {
    return (
      <div className="flex aspect-[16/9] flex-col items-center justify-center gap-2 rounded-2xl bg-stone-200 text-stone-400">
        <Camera className="size-12" />
        <p className="font-semibold">Sem fotos ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {current && (
        <button
          type="button"
          className="block w-full overflow-hidden rounded-2xl"
          onClick={() => setOpen(true)}
          aria-label="Ampliar foto"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/arquivos/${current.webPath}?v=${current.version}`}
            alt={current.caption ?? title}
            className="aspect-[16/9] w-full bg-stone-100 object-cover"
          />
        </button>
      )}

      {ordered.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ordered.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                "shrink-0 overflow-hidden rounded-xl border-[3px]",
                i === index ? "border-brand-600" : "border-transparent",
              )}
              aria-label={`Foto ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/arquivos/${photo.thumbPath}?v=${photo.version}`}
                alt=""
                className="h-20 w-28 bg-stone-100 object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {video && (
        <div>
          <h3 className="mb-2 text-lg font-bold text-stone-900">Vídeo</h3>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            controls
            preload="metadata"
            className="max-h-96 w-full rounded-2xl border border-stone-200 bg-black"
            src={`/api/arquivos/${video.path}`}
          />
        </div>
      )}

      {open && current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            aria-label="Fechar"
            className="absolute right-4 top-4 flex size-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setOpen(false)}
          >
            <X className="size-7" />
          </button>
          {ordered.length > 1 && (
            <button
              type="button"
              aria-label="Foto anterior"
              className="absolute left-3 flex size-14 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setIndex((index - 1 + ordered.length) % ordered.length);
              }}
            >
              <ChevronLeft className="size-8" />
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/arquivos/${current.webPath}?v=${current.version}`}
            alt={current.caption ?? title}
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {ordered.length > 1 && (
            <button
              type="button"
              aria-label="Próxima foto"
              className="absolute right-3 flex size-14 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setIndex((index + 1) % ordered.length);
              }}
            >
              <ChevronRight className="size-8" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
