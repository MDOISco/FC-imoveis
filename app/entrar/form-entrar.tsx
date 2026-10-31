"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch, ApiError } from "@/lib/client-api";

/** Só aceita caminhos internos (evita redirecionar para outro site após o login). */
function safeDestination(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/painel";
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return "/painel";
    return url.pathname + url.search;
  } catch {
    return "/painel";
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
          <Logo className="mx-auto h-56" />
          <h1 className="mt-4 font-display text-4xl font-bold text-stone-900">
            FC Imóveis
          </h1>
          <p className="mt-1 text-lg text-stone-500">
            Acesso restrito à equipe
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

        <p className="mt-5 text-center text-base text-stone-500">
          Esqueceu a senha? Fale com a administração da FC Imóveis.
        </p>
      </form>
    </main>
  );
}
