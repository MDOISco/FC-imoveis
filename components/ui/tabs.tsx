import Link from "next/link";
import { cn } from "@/lib/cn";

export type TabItem = {
  value: string;
  label: string;
  href: string;
  count?: number;
};

/** Abas navegáveis por URL (funciona sem JavaScript). */
export function Tabs({
  items,
  active,
  className,
}: {
  items: TabItem[];
  active: string;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "flex flex-wrap gap-2 border-b-2 border-stone-200 pb-px",
        className,
      )}
      aria-label="Abas"
    >
      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <Link
            key={item.value}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex min-h-12 items-center gap-2 rounded-t-xl border-b-4 px-5 font-semibold transition-colors",
              isActive
                ? "border-brand-700 bg-brand-100 text-brand-900"
                : "border-transparent text-stone-600 hover:bg-stone-100 hover:text-stone-900",
            )}
          >
            {item.label}
            {item.count !== undefined && item.count > 0 && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-sm font-bold",
                  isActive
                    ? "bg-brand-700 text-white"
                    : "bg-stone-200 text-stone-700",
                )}
              >
                {item.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
