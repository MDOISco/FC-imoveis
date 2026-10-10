import { cn } from "@/lib/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={cn(
        "inline-block size-6 animate-spin rounded-full border-[3px] border-stone-300 border-t-brand-700",
        className,
      )}
    />
  );
}
