"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

/** "Já tenho cadastro": cola o link privado (ou só o código) e entra no painel. */
export function AcessarPainel() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function enter() {
    const raw = value.trim();
    if (!raw) return;
    // Aceita o link completo ou só o código final
    const match = raw.match(/painel\/([A-Za-z0-9_-]+)/);
    const token = match ? match[1] : raw;
    if (token.length < 10) {
      toast("Esse link não parece válido. Confira e tente de novo.", "erro");
      return;
    }
    router.push(`/permutas/painel/${token}`);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Cole aqui o seu link de acesso…"
        onKeyDown={(e) => {
          if (e.key === "Enter") enter();
        }}
      />
      <Button className="shrink-0" onClick={enter}>
        Entrar no meu painel
      </Button>
    </div>
  );
}
