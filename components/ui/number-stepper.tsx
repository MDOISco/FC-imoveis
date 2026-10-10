"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

/** Contador com botões grandes − / + (quartos, banheiros, vagas…). */
export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
  className,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
}) {
  const current = value ?? 0;
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <button
        type="button"
        aria-label={label ? `Diminuir ${label}` : "Diminuir"}
        onClick={() => onChange(Math.max(min, current - 1))}
        className="flex size-12 items-center justify-center rounded-xl border-2 border-stone-300 bg-white text-stone-700 transition-colors hover:border-brand-600 hover:text-brand-800 disabled:opacity-40"
        disabled={current <= min}
      >
        <Minus className="size-6" />
      </button>
      <span className="min-w-12 text-center text-xl font-bold tabular-nums text-stone-900">
        {value ?? "–"}
      </span>
      <button
        type="button"
        aria-label={label ? `Aumentar ${label}` : "Aumentar"}
        onClick={() => onChange(Math.min(max, current + 1))}
        className="flex size-12 items-center justify-center rounded-xl border-2 border-stone-300 bg-white text-stone-700 transition-colors hover:border-brand-600 hover:text-brand-800 disabled:opacity-40"
        disabled={current >= max}
      >
        <Plus className="size-6" />
      </button>
    </div>
  );
}
