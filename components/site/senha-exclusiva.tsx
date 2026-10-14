"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/client-api";

/** Formulário de senha do link exclusivo (cliente). */
export function SenhaExclusiva({ token }: { token: string }) {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!senha.trim() || busy) return;
    setBusy(true);
    setErro(null);
    try {
      await apiFetch(`/api/exclusivo/${token}`, {
        method: "POST",
        body: { senha: senha.trim() },
        // Senha errada aqui é erro DESTA tela, não "sessão da equipe expirou"
        redirecionar401: false,
      });
      router.refresh(); // o servidor agora enxerga o cookie e mostra o imóvel
    } catch (err) {
      setErro(
        err instanceof ApiError
          ? err.message
          : "Não foi possível verificar. Tente novamente.",
      );
    } finally {
      // Sempre destrava o botão: se o cookie não pegar (ex.: navegador
      // bloqueando cookies), o cliente consegue tentar de novo.
      setBusy(false);
    }
  }

  return (
    <form onSubmit={entrar} className="space-y-4">
      <label
        htmlFor="senha-exclusiva"
        className="block text-lg font-semibold text-stone-800"
      >
        Senha de acesso
      </label>
      <Input
        id="senha-exclusiva"
        type="password"
        inputMode="text"
        autoComplete="off"
        autoFocus
        placeholder="Digite a senha que você recebeu"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        aria-invalid={erro ? true : undefined}
        className="min-h-14 text-lg"
      />
      {erro && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-base font-semibold text-red-700">
          {erro}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={busy || !senha.trim()}
        className="w-full"
      >
        <KeyRound className="size-6" />
        {busy ? "Verificando…" : "Ver o imóvel"}
      </Button>
    </form>
  );
}
