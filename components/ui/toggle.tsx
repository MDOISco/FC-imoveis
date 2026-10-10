"use client";

import { cn } from "@/lib/cn";

/** Interruptor grande com rótulo (liga/desliga). */
export function Toggle({
  checked,
  onChange,
  label,
  help,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  help?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-8 w-14 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand-600" : "bg-stone-300",
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-6 rounded-full bg-white shadow transition-all",
            checked ? "left-7" : "left-1",
          )}
        />
      </button>
      {(label || help) && (
        <span className="leading-snug">
          {label && (
            <span className="font-medium text-stone-800">{label}</span>
          )}
          {help && <span className="block text-sm text-stone-500">{help}</span>}
        </span>
      )}
    </label>
  );
}
