import { cn } from "@/lib/cn";

// Logo da FC Imóveis: PNGs com fundo transparente em public/logo/.
// A arte original tem linhas marrom-escuras, que somem no verde-escuro dos
// cabeçalhos — nesses fundos usamos a versão "-fundo-escuro" (mesma arte,
// linhas em dourado). fc-logo.png e fc-marca.png (cores originais) ficam
// para fundos claros. Decorativos (alt vazio): o nome da imobiliária sempre
// aparece escrito ao lado.

/** Só a casa com o "FC", ao lado do nome nos cabeçalhos verdes. */
export function LogoMarca() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo/fc-marca-fundo-escuro.png"
      alt=""
      width={141}
      height={192}
      className="h-12 w-auto shrink-0 sm:h-14"
    />
  );
}

/** Logo completo (casa + "Bragança Imóveis"), para fundo verde-escuro. */
export function LogoCompleto({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo/fc-logo-fundo-escuro.png"
      alt=""
      width={357}
      height={480}
      className={cn("w-auto", className)}
    />
  );
}
