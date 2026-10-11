import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "gold";
type Size = "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 shadow-sm",
  secondary:
    "bg-white text-stone-800 border-2 border-stone-300 hover:border-brand-600 hover:text-brand-800",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
  ghost: "bg-transparent text-brand-800 hover:bg-brand-50",
  gold: "bg-gold-400 text-gold-950 hover:bg-gold-300 active:bg-gold-500 shadow-sm font-bold",
};

const sizeClasses: Record<Size, string> = {
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-7 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

export function buttonClasses(variant: Variant = "primary", size: Size = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors",
    variantClasses[variant],
    sizeClasses[size],
  );
}
