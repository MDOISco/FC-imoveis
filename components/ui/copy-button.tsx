"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./button";

export function CopyButton({
  text,
  label = "Copiar",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        // Caminho relativo ("/imovel/...") vira o endereço completo do site
        const full = text.startsWith("/") ? window.location.origin + text : text;
        try {
          await navigator.clipboard.writeText(full);
        } catch {
          // Fallback para contextos sem clipboard API
          const el = document.createElement("textarea");
          el.value = full;
          document.body.appendChild(el);
          el.select();
          document.execCommand("copy");
          document.body.removeChild(el);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }}
    >
      {copied ? (
        <>
          <Check className="size-5 text-brand-700" /> Copiado!
        </>
      ) : (
        <>
          <Copy className="size-5" /> {label}
        </>
      )}
    </Button>
  );
}
