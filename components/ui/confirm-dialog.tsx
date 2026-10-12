"use client";

import { useState } from "react";
import { Button } from "./button";

/** Botão que abre uma confirmação clara antes de executar ações perigosas. */
export function ConfirmButton({
  title,
  message,
  confirmLabel = "Sim, confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  variant = "danger",
  children,
  className,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "danger" | "primary" | "gold";
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <Button
        variant={variant === "danger" ? "secondary" : variant}
        className={className}
        onClick={() => setOpen(true)}
      >
        {children}
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-stone-900">{title}</h3>
            <p className="mt-3 text-base text-stone-600">{message}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                {cancelLabel}
              </Button>
              <Button
                variant={variant}
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await onConfirm();
                    setOpen(false);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Aguarde…" : confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
