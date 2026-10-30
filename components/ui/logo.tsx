import { cn } from "@/lib/cn";

/**
 * Logotipo da imobiliária: a imagem enviada pela equipe, só sem o fundo
 * (public/logo.webp). As cores do logo são escuras, então em fundo escuro
 * use `selo` (plaquinha creme). Decorativo: o nome aparece em texto ao lado,
 * por isso o alt fica vazio. Passe a altura em `className` (ex.: "h-14").
 */
export function Logo({
  selo = false,
  className,
}: {
  selo?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.webp"
      alt=""
      width={478}
      height={640}
      className={cn(
        "w-auto shrink-0",
        selo && "rounded-xl bg-stone-100 p-1",
        className,
      )}
    />
  );
}
