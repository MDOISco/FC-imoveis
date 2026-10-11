"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import { formatRelative, maskPhone } from "@/lib/format";
import { waHref } from "@/lib/whatsapp";
import {
  CHAT_STATUS_BADGE_CLASSES,
  CHAT_STATUS_LABELS,
  type ChatMensagem,
  type ChatStatus,
  horaMensagem,
  juntarMensagens,
} from "./chat-utils";

export type ConversaResumo = {
  id: string;
  nome: string;
  phone: string | null;
  status: ChatStatus;
  lastMessageAt: string; // ISO
  naoLidas: number;
  ultimaPrevia: string | null;
};

/**
 * Painel de conversas da equipe: lista à esquerda, conversa à direita
 * (no celular, uma tela de cada vez com botão de voltar).
 * Polling: 10s na lista, 3s na conversa aberta; nada com a aba escondida.
 */
export function ConversasAdmin({
  conversasIniciais,
}: {
  conversasIniciais: ConversaResumo[];
}) {
  const router = useRouter();
  const [conversas, setConversas] = useState(conversasIniciais);
  const [abertaId, setAbertaId] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<ChatMensagem[]>([]);
  const [statusAberta, setStatusAberta] = useState<ChatStatus>("ABERTO");
  const [carregando, setCarregando] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const listaMsgsRef = useRef<HTMLDivElement>(null);
  const mensagensRef = useRef(mensagens);
  mensagensRef.current = mensagens;

  const aberta = conversas.find((c) => c.id === abertaId) ?? null;

  // Polling da lista (10s). A primeira carga veio do servidor.
  useEffect(() => {
    let ativo = true;
    async function buscar() {
      if (!ativo || document.hidden) return;
      try {
        const res = await apiFetch<{ conversas: ConversaResumo[] }>(
          "/api/chat/admin/conversas",
        );
        if (ativo) setConversas(res.conversas);
      } catch {
        // polling: o próximo ciclo tenta de novo
      }
    }
    const intervalo = window.setInterval(buscar, 10_000);
    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, []);

  // Polling da conversa aberta (3s), com carga completa ao abrir.
  useEffect(() => {
    if (!abertaId) return;
    let ativo = true;
    setMensagens([]);
    mensagensRef.current = [];
    setCarregando(true);

    async function buscar(primeira: boolean) {
      if (!ativo || (!primeira && document.hidden)) return;
      try {
        const cursor = primeira ? null : mensagensRef.current.at(-1)?.id;
        const res = await apiFetch<{
          conversa: { status: ChatStatus };
          mensagens: ChatMensagem[];
        }>(
          `/api/chat/admin/conversas/${abertaId}${
            cursor ? `?depois=${encodeURIComponent(cursor)}` : ""
          }`,
        );
        if (!ativo) return;
        setStatusAberta(res.conversa.status);
        if (res.mensagens.length > 0) {
          setMensagens((prev) => juntarMensagens(prev, res.mensagens));
        }
        // O servidor marcou como lidas: zera a bolinha desta conversa na lista.
        setConversas((prev) =>
          prev.map((c) =>
            c.id === abertaId && c.naoLidas > 0 ? { ...c, naoLidas: 0 } : c,
          ),
        );
      } catch (e) {
        if (primeira && ativo) {
          toast(
            e instanceof ApiError
              ? e.message
              : "Não deu para abrir a conversa. Tente de novo.",
            "erro",
          );
          setAbertaId(null);
        }
      } finally {
        if (primeira && ativo) setCarregando(false);
      }
    }

    void buscar(true);
    const intervalo = window.setInterval(() => void buscar(false), 3_000);
    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, [abertaId]);

  // Rolar para o fim quando chegam/saem mensagens.
  useEffect(() => {
    const el = listaMsgsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensagens, abertaId, carregando]);

  async function enviar() {
    const t = texto.trim();
    if (!t || !abertaId || enviando) return;
    setEnviando(true);
    try {
      const res = await apiFetch<{
        mensagem: ChatMensagem;
        status: ChatStatus;
      }>(`/api/chat/admin/conversas/${abertaId}/mensagens`, {
        method: "POST",
        body: { texto: t },
      });
      setMensagens((prev) => juntarMensagens(prev, [res.mensagem]));
      setStatusAberta(res.status);
      setTexto(""); // só limpa quando deu certo — reenvio simples
      setConversas((prev) =>
        prev.map((c) =>
          c.id === abertaId
            ? {
                ...c,
                status: res.status,
                ultimaPrevia: t.slice(0, 80),
                lastMessageAt: res.mensagem.criadaEm,
              }
            : c,
        ),
      );
    } catch (e) {
      toast(
        e instanceof ApiError
          ? e.message
          : "A resposta não foi enviada. Tente de novo.",
        "erro",
      );
    } finally {
      setEnviando(false);
    }
  }

  async function encerrar() {
    if (!abertaId) return;
    try {
      await apiFetch(`/api/chat/admin/conversas/${abertaId}/encerrar`, {
        method: "POST",
      });
      setStatusAberta("ENCERRADO");
      setConversas((prev) =>
        prev.map((c) =>
          c.id === abertaId ? { ...c, status: "ENCERRADO" } : c,
        ),
      );
      toast("Conversa encerrada.");
      router.refresh();
    } catch (e) {
      toast(
        e instanceof ApiError ? e.message : "Não deu para encerrar.",
        "erro",
      );
    }
  }

  function aoDigitar(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void enviar();
    }
  }

  if (conversas.length === 0) {
    return (
      <EmptyState
        icon={<MessageCircle className="size-12" />}
        title="Nenhuma conversa ainda"
        description="Quando alguém escrever pelo botão de bate-papo do site, a conversa aparece aqui na mesma hora."
      />
    );
  }

  const zap = aberta?.phone
    ? waHref(
        aberta.phone,
        `Olá, ${aberta.nome}! Aqui é da FC Imóveis, continuando nossa conversa do site.`,
      )
    : null;

  return (
    <div className="flex h-[72dvh] min-h-[480px] overflow-hidden rounded-2xl border-2 border-stone-200 bg-white lg:grid lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:grid-rows-[100%]">
      {/* Lista de conversas */}
      <div
        className={cn(
          "w-full flex-col overflow-y-auto border-stone-200 lg:flex lg:border-r-2",
          abertaId ? "hidden" : "flex",
        )}
      >
        {conversas.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setAbertaId(c.id)}
            className={cn(
              "flex w-full flex-col gap-1 border-b border-stone-200 px-4 py-4 text-left transition-colors hover:bg-stone-50",
              abertaId === c.id && "bg-brand-50",
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-lg font-bold text-stone-900">
                {c.nome}
              </span>
              <span
                suppressHydrationWarning
                className="shrink-0 text-sm text-stone-500"
              >
                {formatRelative(c.lastMessageAt)}
              </span>
            </span>
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-base text-stone-600">
                {c.ultimaPrevia ?? "Conversa iniciada"}
              </span>
              {c.naoLidas > 0 ? (
                <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-sm font-bold text-white">
                  {c.naoLidas > 99 ? "99+" : c.naoLidas}
                </span>
              ) : c.status === "ENCERRADO" ? (
                <Badge className={CHAT_STATUS_BADGE_CLASSES.ENCERRADO}>
                  {CHAT_STATUS_LABELS.ENCERRADO}
                </Badge>
              ) : null}
            </span>
          </button>
        ))}
      </div>

      {/* Conversa aberta */}
      <div
        className={cn(
          "w-full flex-col lg:flex",
          abertaId ? "flex" : "hidden",
        )}
      >
        {!abertaId ? (
          <div className="hidden h-full flex-col items-center justify-center gap-3 px-6 text-center lg:flex">
            <MessageCircle className="size-12 text-stone-300" />
            <p className="text-lg text-stone-500">
              Escolha uma conversa na lista ao lado para responder.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b-2 border-stone-200 px-3 py-3 sm:px-4">
              <button
                type="button"
                onClick={() => setAbertaId(null)}
                aria-label="Voltar para a lista de conversas"
                className="flex size-12 shrink-0 items-center justify-center rounded-xl text-stone-600 transition-colors hover:bg-stone-100 lg:hidden"
              >
                <ArrowLeft className="size-6" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-lg font-bold text-stone-900">
                  {aberta?.nome ?? "Conversa"}
                  <Badge
                    className={
                      CHAT_STATUS_BADGE_CLASSES[statusAberta] ??
                      CHAT_STATUS_BADGE_CLASSES.ABERTO
                    }
                  >
                    {CHAT_STATUS_LABELS[statusAberta] ?? statusAberta}
                  </Badge>
                </p>
                {aberta?.phone &&
                  (zap ? (
                    <a
                      href={zap}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-semibold text-brand-800 hover:underline"
                    >
                      WhatsApp {maskPhone(aberta.phone)}
                    </a>
                  ) : (
                    <span className="text-base text-stone-600">
                      {maskPhone(aberta.phone)}
                    </span>
                  ))}
              </div>
              {statusAberta === "ABERTO" && (
                <ConfirmButton
                  title="Encerrar esta conversa?"
                  message={`A conversa com ${aberta?.nome ?? "o cliente"} será marcada como encerrada. Se a pessoa escrever de novo, ela reabre sozinha.`}
                  confirmLabel="Sim, encerrar"
                  onConfirm={encerrar}
                >
                  Encerrar conversa
                </ConfirmButton>
              )}
            </div>

            <div
              ref={listaMsgsRef}
              className="flex-1 space-y-3 overflow-y-auto bg-stone-100 px-4 py-4"
            >
              {carregando ? (
                <div className="flex h-full items-center justify-center">
                  <Spinner />
                </div>
              ) : (
                <>
                  {mensagens.length === 0 && (
                    <p className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base text-stone-600">
                      {aberta?.nome ?? "O cliente"} abriu a conversa mas ainda
                      não escreveu. Você pode mandar a primeira mensagem. 😊
                    </p>
                  )}
                  {mensagens.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "flex",
                        m.de === "EQUIPE" ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2.5",
                          m.de === "EQUIPE"
                            ? "rounded-br-sm bg-brand-700 text-white"
                            : "rounded-bl-sm border border-stone-200 bg-white text-stone-800",
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words text-base">
                          {m.texto}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-right text-xs",
                            m.de === "EQUIPE"
                              ? "text-brand-200"
                              : "text-stone-400",
                          )}
                        >
                          {horaMensagem(m.criadaEm)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {statusAberta === "ENCERRADO" && (
                    <p className="rounded-xl bg-stone-200 px-4 py-2.5 text-center text-sm font-medium text-stone-700">
                      Conversa encerrada — se você responder, ela reabre.
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="border-t-2 border-stone-200 bg-white p-3">
              <div className="flex items-end gap-2">
                <Textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={aoDigitar}
                  rows={2}
                  maxLength={2000}
                  placeholder={`Responder para ${aberta?.nome ?? "o cliente"}…`}
                  aria-label="Sua resposta"
                  className="min-h-14 flex-1 resize-none"
                />
                <Button
                  onClick={() => void enviar()}
                  disabled={enviando || texto.trim() === ""}
                  size="lg"
                  className="shrink-0"
                >
                  <Send className="size-5" />
                  <span className="hidden sm:inline">Responder</span>
                </Button>
              </div>
              <p className="mt-1.5 text-sm text-stone-500">
                Enter envia · Shift+Enter quebra a linha
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
