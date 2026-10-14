"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  KeyRound,
  Link2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-dialog";
import { CopyButton } from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import { formatDate, formatRelative } from "@/lib/format";

export type LinkPrivadoDto = {
  id: string;
  clientName: string;
  active: boolean;
  viewCount: number;
  lastViewAt: string | null;
  createdAt: string;
  url: string;
};

/** Senha fácil de ditar por telefone: 2 letras + 4 números (sem 0/O, 1/l). */
function gerarSenha(): string {
  const letras = "abcdefghjkmnpqrstuvwxyz";
  const l = () => letras[Math.floor(Math.random() * letras.length)];
  const n = () => String(Math.floor(Math.random() * 7) + 2);
  return `${l()}${l()}${n()}${n()}${n()}${n()}`;
}

function mensagemPronta(clientName: string, url: string, senha: string) {
  return (
    `Olá, ${clientName}! Preparamos uma apresentação exclusiva de um imóvel para você.\n\n` +
    `🔗 Link: ${url}\n🔑 Senha: ${senha}\n\n` +
    `É só abrir o link e digitar a senha. Qualquer dúvida, estamos à disposição! — FC Imóveis`
  );
}

/**
 * Links exclusivos do imóvel: o corretor cria um link com senha para CADA
 * cliente, copia a mensagem pronta e manda no WhatsApp. Desligar o link
 * corta o acesso na hora.
 */
export function LinksPrivados({
  propertyId,
  initialLinks,
}: {
  propertyId: string;
  initialLinks: LinkPrivadoDto[];
}) {
  const [links, setLinks] = useState(initialLinks);
  const [formAberto, setFormAberto] = useState(initialLinks.length === 0);
  const [nome, setNome] = useState("");
  // Começa vazia e sorteia só no navegador: sortear durante a renderização
  // faria o servidor e o navegador gerarem senhas diferentes (erro de
  // "hydration" do React e senha mostrada ≠ senha salva).
  const [senha, setSenha] = useState("");
  useEffect(() => {
    setSenha((s) => s || gerarSenha());
  }, []);
  const [busy, setBusy] = useState(false);
  // Último link criado: só aqui dá para copiar a senha (não fica salva à mostra)
  const [novo, setNovo] = useState<{ link: LinkPrivadoDto; senha: string } | null>(
    null,
  );

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const resp = await apiFetch<{ link: LinkPrivadoDto }>(
        `/api/imoveis/${propertyId}/links`,
        { method: "POST", body: { clientName: nome.trim(), senha: senha.trim() } },
      );
      setLinks((ls) => [resp.link, ...ls]);
      setNovo({ link: resp.link, senha: senha.trim() });
      setNome("");
      setSenha(gerarSenha());
      setFormAberto(false);
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Não foi possível criar.",
        "erro",
      );
    } finally {
      setBusy(false);
    }
  }

  async function setAtivo(link: LinkPrivadoDto, active: boolean) {
    try {
      await apiFetch(`/api/imoveis/${propertyId}/links/${link.id}`, {
        method: "PATCH",
        body: { active },
      });
      setLinks((ls) =>
        ls.map((l) => (l.id === link.id ? { ...l, active } : l)),
      );
      toast(active ? "Link reativado." : "Link desativado.");
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Não foi possível salvar.",
        "erro",
      );
    }
  }

  async function excluir(link: LinkPrivadoDto) {
    try {
      await apiFetch(`/api/imoveis/${propertyId}/links/${link.id}`, {
        method: "DELETE",
      });
      setLinks((ls) => ls.filter((l) => l.id !== link.id));
      if (novo?.link.id === link.id) setNovo(null);
      toast("Link excluído.");
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Não foi possível excluir.",
        "erro",
      );
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-base text-stone-600">
        Crie um link com senha para <strong>cada cliente</strong>: ele vê só
        este imóvel, sem acesso ao resto do site. Funciona mesmo com o imóvel
        fora do site público.
      </p>

      {/* Painel do link recém-criado: única chance de copiar a senha */}
      {novo && (
        <div className="space-y-3 rounded-2xl border-2 border-gold-300 bg-gold-50 p-4">
          <p className="flex items-center gap-2 text-lg font-bold text-gold-900">
            <Sparkles className="size-5" /> Link de {novo.link.clientName} criado!
          </p>
          <p className="break-all rounded-xl bg-white p-3 font-mono text-sm text-stone-700">
            {novo.link.url}
            <br />
            Senha: <strong>{novo.senha}</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            <CopyButton
              text={mensagemPronta(novo.link.clientName, novo.link.url, novo.senha)}
              label="Copiar mensagem pronta (link + senha)"
            />
            <CopyButton text={novo.link.url} label="Copiar só o link" />
          </div>
          <p className="text-sm font-semibold text-gold-900">
            ⚠️ Anote ou envie a senha agora: por segurança, ela não fica salva
            à mostra. Se perder, é só excluir este link e criar outro.
          </p>
        </div>
      )}

      {formAberto ? (
        <form
          onSubmit={criar}
          className="space-y-3 rounded-2xl border-2 border-stone-200 bg-stone-50 p-4"
        >
          <div>
            <label
              htmlFor="link-nome"
              className="mb-1 block font-semibold text-stone-800"
            >
              Nome do cliente
            </label>
            <Input
              id="link-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="ex.: Maria Souza"
              maxLength={60}
            />
          </div>
          <div>
            <label
              htmlFor="link-senha"
              className="mb-1 block font-semibold text-stone-800"
            >
              Senha para este cliente
            </label>
            <div className="flex gap-2">
              <Input
                id="link-senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                maxLength={40}
                className="font-mono"
              />
              <Button
                variant="secondary"
                onClick={() => setSenha(gerarSenha())}
                title="Sugerir outra senha"
              >
                <KeyRound className="size-5" /> Sortear
              </Button>
            </div>
            <p className="mt-1 text-sm text-stone-500">
              Pode trocar por uma senha sua (mínimo 4 caracteres). Maiúsculas e
              minúsculas tanto faz na hora de o cliente digitar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={busy || nome.trim().length < 2 || senha.trim().length < 4}
            >
              {busy ? "Criando…" : "Criar link"}
            </Button>
            <Button variant="ghost" onClick={() => setFormAberto(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="secondary" onClick={() => setFormAberto(true)}>
          <Plus className="size-5" /> Criar link para um cliente
        </Button>
      )}

      {links.length > 0 && (
        <ul className="space-y-3">
          {links.map((link) => (
            <li
              key={link.id}
              className="rounded-2xl border-2 border-stone-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-lg font-bold text-stone-900">
                  {link.clientName}
                </p>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-bold ${
                    link.active
                      ? "bg-brand-100 text-brand-900"
                      : "bg-stone-200 text-stone-600"
                  }`}
                >
                  {link.active ? "Ativo" : "Desativado"}
                </span>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-stone-600">
                <span>Criado em {formatDate(link.createdAt)}</span>
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="size-5 text-stone-400" />
                  {link.viewCount === 0 ? (
                    "cliente ainda não abriu"
                  ) : (
                    // suppressHydrationWarning: o "há X minutos" pode mudar
                    // entre o servidor renderizar e o navegador assumir.
                    <span suppressHydrationWarning>
                      {`${link.viewCount} visita${link.viewCount > 1 ? "s" : ""} · última ${formatRelative(link.lastViewAt!)}`}
                    </span>
                  )}
                </span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton text={link.url} label="Copiar link" />
                {link.active ? (
                  <ConfirmButton
                    title="Desativar este link?"
                    message={`${link.clientName} não vai mais conseguir abrir a página (dá para reativar depois).`}
                    confirmLabel="Sim, desativar"
                    onConfirm={() => setAtivo(link, false)}
                  >
                    <Link2 className="size-5" /> Desativar
                  </ConfirmButton>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => setAtivo(link, true)}
                    >
                      <Link2 className="size-5" /> Reativar
                    </Button>
                    <ConfirmButton
                      title="Excluir este link?"
                      message="O link some da lista e deixa de funcionar para sempre."
                      confirmLabel="Sim, excluir"
                      onConfirm={() => excluir(link)}
                    >
                      <Trash2 className="size-5" /> Excluir
                    </ConfirmButton>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
