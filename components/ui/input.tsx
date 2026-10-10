import { cn } from "@/lib/cn";

export function Input({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "w-full min-h-12 rounded-xl border-2 border-stone-300 bg-white px-4 text-stone-900 placeholder:text-stone-400",
        "focus:border-brand-600 focus:outline-none aria-[invalid=true]:border-red-500",
        className,
      )}
      {...props}
    />
  );
}
