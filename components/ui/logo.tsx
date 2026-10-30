import { cn } from "@/lib/cn";

// Logotipo da imobiliária: a imagem enviada pela dona, com fundo
// transparente e as cores originais (public/logo/). Nunca vai sobre
// plaquinha ou fundo branco — ela pediu fundo transparente. Decorativo: o
// nome aparece em texto ao lado, por isso o alt fica vazio.

/** Logo completo (casa + "Bragança Imóveis"). Passe a altura em `className`. */
export function Logo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo/fc-logo.png"
      alt=""
      width={357}
      height={480}
      className={cn("w-auto shrink-0", className)}
    />
  );
}

/** Só a casa com o "FC": nos cabeçalhos, direto sobre o verde. */
export function LogoMarca() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo/fc-marca.png"
      alt=""
      width={141}
      height={192}
      className="h-12 w-auto shrink-0 sm:h-14"
    />
  );
}
