import { cn } from "@/lib/cn";

/**
 * Logotipo da imobiliária (imagem em public/logo.webp). Decorativo: o nome
 * aparece em texto ao lado, então o alt fica vazio.
 */
export function Logo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.webp"
      alt=""
      width={800}
      height={800}
      className={cn("size-12 shrink-0 rounded-xl object-cover", className)}
    />
  );
}
