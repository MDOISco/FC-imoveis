"use client";

import { useState } from "react";
import { Search, Wand2 } from "lucide-react";
import { BuscaImoveis } from "@/components/site/busca-imoveis";
import { BuscaPerfil } from "@/components/site/busca-perfil";
import { cn } from "@/lib/cn";
import type { Busca, ItemBusca } from "@/lib/busca-site";

/**
 * Caixa única de busca do site, logo abaixo do banner (pedido da dona,
 * nov/2026): começa COMPACTA e vai abrindo conforme a pessoa interage.
 * Duas opções lado a lado:
 *  - "Buscar imóveis": o motor padrão de imobiliária (busca-imoveis.tsx),
 *    que também começa enxuto e se expande ao clicar;
 *  - "Conte como você mora": a busca personalizada (busca-perfil.tsx).
 * As duas levam para a mesma vitrine (#imoveis), que vem logo em seguida.
 */
export function BuscaSite({
  itens,
  inicial,
  whatsapp,
}: {
  itens: ItemBusca[];
  inicial: Busca;
  whatsapp: string | null;
}) {
  const [modo, setModo] = useState<"filtros" | "perfil">("filtros");

  return (
    <section
      id="busca"
      aria-label="Buscar imóveis"
      className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-4 pt-8 sm:px-6"
    >
      {/* As duas formas de buscar, lado a lado */}
      <div role="tablist" aria-label="Como você quer buscar?" className="grid grid-cols-2 gap-2 sm:gap-3">
        <Aba
          ativo={modo === "filtros"}
          onClick={() => setModo("filtros")}
          icone={<Search className="size-5 sm:size-6" />}
          titulo="Buscar imóveis"
          descricao="Tipo, bairro, valor…"
        />
        <Aba
          ativo={modo === "perfil"}
          onClick={() => setModo("perfil")}
          icone={<Wand2 className="size-5 sm:size-6" />}
          titulo="Conte como você mora"
          descricao="A gente acha para você"
        />
      </div>

      {/* hidden mantém o que a pessoa já escolheu ao trocar de aba */}
      <div role="tabpanel" hidden={modo !== "filtros"} className="mt-3">
        <BuscaImoveis itens={itens} inicial={inicial} whatsapp={whatsapp} />
      </div>
      <div role="tabpanel" id="busca-perfil" hidden={modo !== "perfil"} className="mt-3">
        <BuscaPerfil itens={itens} aoAbrirBuscaCompleta={() => setModo("filtros")} />
      </div>
    </section>
  );
}

function Aba({
  ativo,
  onClick,
  icone,
  titulo,
  descricao,
}: {
  ativo: boolean;
  onClick: () => void;
  icone: React.ReactNode;
  titulo: string;
  descricao: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={ativo}
      onClick={onClick}
      className={cn(
        "flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 px-3 py-3 text-center transition-all duration-300 sm:min-h-20 sm:flex-row sm:gap-3 sm:text-left",
        ativo
          ? "border-gold-400 bg-white shadow-lg"
          : "border-transparent bg-white/70 hover:-translate-y-0.5 hover:bg-white",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-11",
          ativo ? "bg-gold-400 text-gold-950" : "bg-brand-100 text-brand-800",
        )}
      >
        {icone}
      </span>
      <span>
        <span
          className={cn(
            "block text-base font-bold leading-tight sm:text-lg",
            ativo ? "text-stone-900" : "text-stone-700",
          )}
        >
          {titulo}
        </span>
        <span className="hidden text-sm font-semibold text-stone-500 sm:block">
          {descricao}
        </span>
      </span>
    </button>
  );
}
