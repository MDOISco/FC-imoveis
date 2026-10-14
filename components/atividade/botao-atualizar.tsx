"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Recarrega a lista de visitas sem sair da página (não há atualização automática). */
export function BotaoAtualizar() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [girando, setGirando] = useState(false);

  function atualizar() {
    setGirando(true);
    startTransition(() => {
      router.refresh();
      window.setTimeout(() => setGirando(false), 600);
    });
  }

  return (
    <Button variant="secondary" size="lg" onClick={atualizar} disabled={pending}>
      <RefreshCw className={`size-5 ${girando || pending ? "animate-spin" : ""}`} />
      Atualizar lista
    </Button>
  );
}
