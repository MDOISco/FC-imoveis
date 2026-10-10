import { cn } from "@/lib/cn";
import type { Option } from "@/lib/constants";

/** Grupo de cartões-rádio grandes (um conceito por cartão, fácil de tocar). */
export function RadioCards({
  name,
  options,
  value,
  onChange,
  columns = 2,
  helpByValue,
}: {
  name: string;
  options: Option[];
  value?: string | null;
  onChange: (value: string) => void;
  columns?: 1 | 2 | 3 | 4;
  helpByValue?: Record<string, string>;
}) {
  const grid =
    columns === 1
      ? "grid-cols-1"
      : columns === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : columns === 3
          ? "grid-cols-1 sm:grid-cols-3"
          : "grid-cols-2 sm:grid-cols-4";
  return (
    <div role="radiogroup" className={cn("grid gap-3", grid)}>
      {options.map((o) => {
        const checked = value === o.value;
        return (
          <label
            key={o.value}
            className={cn(
              "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors",
              checked
                ? "border-brand-600 bg-brand-50"
                : "border-stone-200 bg-white hover:border-brand-300",
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={checked}
              onChange={() => onChange(o.value)}
              className="size-5 shrink-0 accent-brand-700"
            />
            <span className="leading-snug">
              <span
                className={cn(
                  "font-semibold",
                  checked ? "text-brand-900" : "text-stone-800",
                )}
              >
                {o.label}
              </span>
              {helpByValue?.[o.value] && (
                <span className="block text-sm text-stone-500">
                  {helpByValue[o.value]}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}
