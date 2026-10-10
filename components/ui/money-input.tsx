"use client";

import { cn } from "@/lib/cn";
import { formatMoneyTyping, parseMoneyInput } from "@/lib/format";

/** Campo de dinheiro em reais inteiros com prefixo R$ e pontuação automática. */
export function MoneyInput({
  value,
  onChange,
  className,
  ...props
}: Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
> & {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-semibold text-stone-500">
        R$
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={formatMoneyTyping(value)}
        onChange={(e) => onChange(parseMoneyInput(e.target.value))}
        className={cn(
          "w-full min-h-12 rounded-xl border-2 border-stone-300 bg-white pl-12 pr-4 text-stone-900 placeholder:text-stone-400",
          "focus:border-brand-600 focus:outline-none aria-[invalid=true]:border-red-500",
          className,
        )}
        placeholder="0"
        {...props}
      />
    </div>
  );
}
