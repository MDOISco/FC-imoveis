import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-6 py-14 text-center",
        className,
      )}
    >
      {icon && <div className="mb-4 text-stone-400">{icon}</div>}
      <h3 className="text-xl font-bold text-stone-700">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-base text-stone-500">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
