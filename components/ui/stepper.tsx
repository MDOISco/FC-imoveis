import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/** Indicador de progresso do passo a passo (números grandes e nome da etapa). */
export function Stepper({
  steps,
  current,
}: {
  steps: string[];
  current: number; // 1-based
}) {
  return (
    <div>
      <p className="mb-3 text-base font-semibold text-stone-600">
        Etapa {current} de {steps.length}:{" "}
        <span className="text-brand-800">{steps[current - 1]}</span>
      </p>
      <ol className="flex items-center gap-1 sm:gap-2" aria-hidden="true">
        {steps.map((step, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          return (
            <li key={step} className="flex flex-1 items-center gap-1 sm:gap-2">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold sm:size-10 sm:text-base",
                  done && "bg-brand-700 text-white",
                  active && "bg-gold-400 text-gold-950 ring-4 ring-gold-200",
                  !done && !active && "bg-stone-200 text-stone-500",
                )}
                title={step}
              >
                {done ? <Check className="size-5" /> : n}
              </span>
              {n < steps.length && (
                <span
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    done ? "bg-brand-700" : "bg-stone-200",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
