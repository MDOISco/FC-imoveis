"use client";

import { useState } from "react";
import { onlyDigits } from "@/lib/format";

export type CepResult = {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

/** Busca de endereço pelo CEP (ViaCEP, chamado direto do navegador). */
export function useViaCep() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup(cep: string): Promise<CepResult | null> {
    const digits = onlyDigits(cep);
    if (digits.length !== 8) return null;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = (await res.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (data.erro) {
        setError("CEP não encontrado. Pode preencher o endereço manualmente.");
        return null;
      }
      return {
        street: data.logradouro ?? "",
        neighborhood: data.bairro ?? "",
        city: data.localidade ?? "",
        state: data.uf ?? "",
      };
    } catch {
      setError(
        "Não foi possível buscar o CEP agora. Preencha o endereço manualmente.",
      );
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { lookup, loading, error, clearError: () => setError(null) };
}
