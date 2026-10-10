import { cn } from "@/lib/cn";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border-2 border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400",
        "focus:border-brand-600 focus:outline-none aria-[invalid=true]:border-red-500",
        className,
      )}
      {...props}
    />
  );
}
