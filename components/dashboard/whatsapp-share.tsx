"use client";

import { MessageCircle } from "lucide-react";

/**
 * Abre o WhatsApp com um texto pronto sobre o imóvel + o link da página
 * pública. Só faz sentido quando o imóvel está NO AR no site (quem chama
 * decide); o painel e o site rodam no mesmo endereço, então o link público
 * sai de window.location.origin.
 */
export function WhatsappShare({
  propertyId,
  texto,
  compact = false,
}: {
  propertyId: string;
  /** Texto pronto (título, resumo, preço) — o link é acrescentado aqui. */
  texto: string;
  compact?: boolean;
}) {
  function abrir() {
    const link = `${window.location.origin}/imovel/${propertyId}`;
    const url = `https://wa.me/?text=${encodeURIComponent(`${texto}\n${link}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={abrir}
      className={
        compact
          ? "inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-green-600 px-4 font-semibold text-white shadow-sm hover:bg-green-700"
          : "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-green-700 active:bg-green-800"
      }
    >
      <MessageCircle className="size-5" /> Enviar por WhatsApp
    </button>
  );
}
