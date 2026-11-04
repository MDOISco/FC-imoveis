"use client";

import { Printer } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

/**
 * Botão da página de impressão: abre a janela de imprimir do navegador.
 * Lá dá para mandar à impressora ou escolher "Salvar como PDF".
 * Some na impressão (print:hidden).
 */
export function ImprimirBotao() {
  return (
    <div className="print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className={buttonClasses("primary", "lg")}
      >
        <Printer className="size-6" /> Imprimir ou salvar em PDF
      </button>
      <p className="mt-2 text-sm text-stone-500">
        Na janela que abrir, escolha a impressora ou “Salvar como PDF” para
        gerar o arquivo e enviar ao cliente.
      </p>
    </div>
  );
}
