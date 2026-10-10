import { cn } from "@/lib/cn";

/** Rótulo grande + ajuda + mensagem de erro em volta de qualquer controle. */
export function Field({
  label,
  help,
  error,
  required,
  htmlFor,
  className,
  children,
}: {
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-base font-semibold text-stone-800"
      >
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {help && <p className="text-sm text-stone-500">{help}</p>}
      {children}
      {error && (
        <p role="alert" className="text-base font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
