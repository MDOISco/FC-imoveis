"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type Toast = { id: number; message: string; kind: "sucesso" | "erro" };

let nextId = 1;
let listeners: Array<(t: Toast) => void> = [];

/** Mostra um aviso rápido no canto da tela (pode ser chamado de qualquer lugar). */
export function toast(message: string, kind: "sucesso" | "erro" = "sucesso") {
  const t: Toast = { id: nextId++, message, kind };
  listeners.forEach((fn) => fn(t));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const add = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 4500);
    };
    listeners.push(add);
    return () => {
      listeners = listeners.filter((fn) => fn !== add);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto rounded-xl px-5 py-3.5 text-base font-semibold shadow-lg",
            t.kind === "sucesso"
              ? "bg-brand-800 text-white"
              : "bg-red-700 text-white",
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
