import { cn } from "@/lib/cn";

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold",
        className ?? "bg-stone-200 text-stone-800",
      )}
    >
      {children}
    </span>
  );
}
