"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";

/**
 * Bolinha vermelha de mensagens não lidas no item "Conversas" da navegação.
 * Consulta a API a cada 20s; qualquer falha é silêncio absoluto
 * (a navegação nunca pode quebrar por causa disso).
 */
export function ChatNaoLidasBadge() {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let ativo = true;
    async function buscar() {
      if (document.hidden) return;
      try {
        const res = await apiFetch<{ total: number }>(
          "/api/chat/admin/nao-lidas",
        );
        if (ativo) setTotal(res.total);
      } catch {
        // silêncio absoluto: mantém o último valor conhecido
      }
    }
    buscar();
    const intervalo = window.setInterval(buscar, 20_000);
    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, []);

  if (total <= 0) return null;
  return (
    <span
      aria-label={`${total} ${total === 1 ? "mensagem não lida" : "mensagens não lidas"}`}
      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white"
    >
      {total > 99 ? "99+" : total}
    </span>
  );
}
