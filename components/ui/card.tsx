import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-stone-200 bg-white shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardSection({
  title,
  action,
  className,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && (
            <h2 className="text-xl font-bold text-stone-900">{title}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </Card>
  );
}
