import { cn } from "@/lib/cn";

/** Checkbox grande com rótulo clicável (alvo ≥ 48px). */
export function CheckboxField({
  label,
  help,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  help?: string;
}) {
  return (
    <label
      className={cn(
        "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 border-stone-200 bg-white px-4 py-2.5",
        "transition-colors hover:border-brand-400 has-checked:border-brand-600 has-checked:bg-brand-50",
        className,
      )}
    >
      <input
        type="checkbox"
        className="size-6 shrink-0 accent-brand-700"
        {...props}
      />
      <span className="leading-snug">
        <span className="font-medium text-stone-800">{label}</span>
        {help && <span className="block text-sm text-stone-500">{help}</span>}
      </span>
    </label>
  );
}
