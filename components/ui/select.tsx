import { cn } from "@/lib/cn";
import type { Option } from "@/lib/constants";

export function Select({
  className,
  options,
  placeholder,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options?: Option[];
  placeholder?: string;
}) {
  return (
    <select
      className={cn(
        "w-full min-h-12 appearance-none rounded-xl border-2 border-stone-300 bg-white px-4 pr-10 text-stone-900",
        "focus:border-brand-600 focus:outline-none aria-[invalid=true]:border-red-500",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2357534e%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.9rem_center] bg-no-repeat",
        className,
      )}
      {...props}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options?.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
      {children}
    </select>
  );
}
