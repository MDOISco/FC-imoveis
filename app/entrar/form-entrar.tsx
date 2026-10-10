"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Home, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch, ApiError } from "@/lib/client-api";

/** Só aceita caminhos internos (evita redirecionar para outro site após o login). */
function safeDestination(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return "/";
    return url.pathname + url.search;
  } catch {
    return "/";
  }
}

export function FormEntrar() {
  const router = useRouter();
  const params = useSearchParams();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!senha) {
      setErro("Digite a senha de acesso.");
      return;
    }
    setEntrando(true);
    setErro(null);
    try {
      await apiFetch("/api/entrar", { method: "POST", body: { senha } });
      router.push(safeDestination(params.get("de")));
      router.refresh();
    } catch (err) {
      setErro(
        err instanceof ApiError
          ? err.message
          : "Não foi possível entrar. Tente novamente.",
      );
      setEntrando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-950 p-4">
      <form
        onSubmit={entrar}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
      >
        <div className="mb-6 text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gold-400 text-gold-950">
            <Home className="size-9" />
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-stone-900">
            FC Imóveis
          </h1>
          <p className="mt-1 text-lg text-stone-500">
            Painel da equipe — acesso restrito
          </p>
        </div>

        <Field label="Senha de acesso" htmlFor="senha" error={erro ?? undefined}>
          <Input
            id="senha"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={senha}
            onChange={(e) => {
              setSenha(e.target.value);
              setErro(null);
            }}
            placeholder="Digite a senha da equipe"
          />
        </Field>

        <Button type="submit" size="lg" className="mt-5 w-full" disabled={entrando}>
          {entrando ? (
            <Spinner className="border-white/40 border-t-white" />
          ) : (
            <>
              <KeyRound className="size-5" /> Entrar no painel
            </>
          )}
        </Button>

        <p className="mt-5 text-center text-base text-stone-400">
          Esqueceu a senha? Fale com a administração da FC Imóveis.
        </p>
      </form>
    </main>
  );
}
