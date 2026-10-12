"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import { maskPhone } from "@/lib/format";
import {
  type ChatMensagem,
  type ChatStatus,
  horaMensagem,
  juntarMensagens,
} from "./chat-utils";

const TOKEN_KEY = "fc_chat_token";

// localStorage pode falhar (navegação anônima etc.) — sempre em try/catch.
function lerToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
function salvarToken(token: string) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // sem armazenamento, a conversa vale só enquanto a página estiver aberta
  }
}
function apagarToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // nada a fazer
  }
}

/**
 * Bate-papo ao vivo do site: botão flutuante dourado presente em todas as
 * páginas públicas. Aberto, faz polling de 3s; fechado, 20s só para a
 * bolinha de não lidas. Nada roda com a aba escondida (document.hidden).
 */
export function ChatWidget() {
  const [aberto, setAberto] = useState(false);
  const [pronto, setPronto] = useState(false); // já leu o localStorage
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<ChatStatus>("ABERTO");
  const [mensagens, setMensagens] = useState<ChatMensagem[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);

  // mini-formulário de boas-vindas
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);

  // caixa de envio
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const listaRef = useRef<HTMLDivElement>(null);
  const abertoRef = useRef(aberto);
  const mensagensRef = useRef(mensagens);
  mensagensRef.current = mensagens;

  useEffect(() => {
    setToken(lerToken());
    setPronto(true);
  }, []);

  useEffect(() => {
    abertoRef.current = aberto;
    if (aberto) setNaoLidas(0); // abriu o painel = viu as mensagens
  }, [aberto]);

  // Rolar para o fim ao abrir e ao chegar/enviar mensagem.
  useEffect(() => {
    const el = listaRef.current;
    if (aberto && el) el.scrollTop = el.scrollHeight;
  }, [aberto, mensagens]);

  // Polling: 3s com o painel aberto, 20s fechado (só a bolinha).
  useEffect(() => {
    if (!pronto || !token) return;
    let ativo = true;

    async function buscar() {
      if (!ativo || document.hidden) return;
      try {
        if (abertoRef.current) {
          const cursor = mensagensRef.current.at(-1)?.id;
          const res = await apiFetch<{
            status: ChatStatus;
            mensagens: ChatMensagem[];
          }>(
            `/api/chat/conversas/${token}${
              cursor ? `?depois=${encodeURIComponent(cursor)}` : ""
            }`,
          );
          if (!ativo) return;
          setStatus(res.status);
          if (res.mensagens.length > 0) {
            setMensagens((prev) => juntarMensagens(prev, res.mensagens));
          }
        } else {
          const res = await apiFetch<{ status: ChatStatus; naoLidas: number }>(
            `/api/chat/conversas/${token}?espiar=1`,
          );
          if (!ativo) return;
          setStatus(res.status);
          setNaoLidas(res.naoLidas);
        }
      } catch (e) {
        // Conversa apagada no servidor: recomeça do zero, sem alarde.
        if (e instanceof ApiError && e.status === 404) {
          apagarToken();
          if (ativo) {
            setToken(null);
            setMensagens([]);
            setNaoLidas(0);
          }
        }
        // Outras falhas: silêncio — o próximo polling tenta de novo.
      }
    }

    buscar();
    const intervalo = window.setInterval(buscar, aberto ? 3_000 : 20_000);
    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, [pronto, token, aberto]);

  async function comecar(e: React.FormEvent) {
    e.preventDefault();
    if (nome.trim().length < 2) {
      setErroNome("Escreva seu nome para começarmos.");
      return;
    }
    setErroNome(null);
    setCriando(true);
    try {
      const res = await apiFetch<{ clientToken: string }>(
        "/api/chat/conversas",
        {
          method: "POST",
          body: {
            nome: nome.trim(),
            whatsapp: whatsapp.trim() || undefined,
          },
        },
      );
      salvarToken(res.clientToken);
      setMensagens([]);
      setStatus("ABERTO");
      setToken(res.clientToken);
    } catch (e) {
      toast(
        e instanceof ApiError
          ? e.message
          : "Não deu para começar a conversa. Tente de novo.",
        "erro",
      );
    } finally {
      setCriando(false);
    }
  }

  async function enviar() {
    const t = texto.trim();
    if (!t || !token || enviando) return;
    setEnviando(true);
    try {
      const res = await apiFetch<{
        mensagem: ChatMensagem;
        status: ChatStatus;
      }>(`/api/chat/conversas/${token}/mensagens`, {
        method: "POST",
        body: { texto: t },
      });
      setMensagens((prev) => juntarMensagens(prev, [res.mensagem]));
      setStatus(res.status);
      setTexto(""); // só limpa quando deu certo — reenvio simples
    } catch (e) {
      toast(
        e instanceof ApiError
          ? e.message
          : "A mensagem não foi enviada. Toque em enviar de novo.",
        "erro",
      );
    } finally {
      setEnviando(false);
    }
  }

  function aoDigitar(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void enviar();
    }
  }

  return (
    <>
      {/* Botão flutuante */}
      {!aberto && (
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir bate-papo com a FC Imóveis"
          className="fixed bottom-5 right-5 z-50 flex size-16 items-center justify-center rounded-full bg-gold-400 text-gold-950 shadow-xl transition-colors hover:bg-gold-300 active:bg-gold-500"
        >
          <MessageCircle className="size-8" />
          {naoLidas > 0 && (
            <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-sm font-bold text-white">
              {naoLidas > 9 ? "9+" : naoLidas}
            </span>
          )}
        </button>
      )}

      {/* Painel: folha quase tela cheia no celular, cartão no computador */}
      {aberto && (
        <div
          role="dialog"
          aria-label="Bate-papo com a FC Imóveis"
          className="fixed inset-x-0 bottom-0 z-50 flex h-[88dvh] flex-col overflow-hidden rounded-t-2xl border-2 border-b-0 border-gold-500 bg-white shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[600px] sm:max-h-[82dvh] sm:w-[380px] sm:rounded-2xl sm:border-b-2"
        >
          <div className="flex items-center justify-between gap-3 bg-brand-950 px-4 py-3 text-white">
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold">
                FC Imóveis — fale com a gente
              </p>
              <p className="truncate text-xs text-brand-200">
                Respondemos por aqui mesmo, em horário comercial.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar bate-papo"
              className="flex size-12 shrink-0 items-center justify-center rounded-xl text-brand-100 transition-colors hover:bg-brand-800"
            >
              <X className="size-6" />
            </button>
          </div>

          {pronto && !token ? (
            // Primeira vez: mini-formulário acolhedor
            <form
              onSubmit={comecar}
              className="flex flex-1 flex-col gap-5 overflow-y-auto p-5"
            >
              <div>
                <p className="text-xl font-bold text-stone-900">Olá! 👋</p>
                <p className="mt-1 text-base text-stone-600">
                  Deixe seu nome e já começamos a conversar com a nossa equipe.
                </p>
              </div>
              <Field
                label="Seu nome"
                required
                htmlFor="chat-nome"
                error={erroNome ?? undefined}
              >
                <Input
                  id="chat-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  autoComplete="name"
                  maxLength={120}
                  placeholder="Como podemos te chamar?"
                />
              </Field>
              <Field
                label="WhatsApp"
                htmlFor="chat-whatsapp"
                help="Opcional — para continuarmos se a conexão cair."
              >
                <Input
                  id="chat-whatsapp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(11) 99999-0000"
                />
              </Field>
              <Button type="submit" size="lg" disabled={criando} className="mt-auto">
                {criando ? "Abrindo…" : "Começar conversa"}
              </Button>
            </form>
          ) : (
            <>
              <div
                ref={listaRef}
                className="flex-1 space-y-3 overflow-y-auto bg-stone-100 px-4 py-4"
              >
                {mensagens.length === 0 && (
                  <p className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base text-stone-600">
                    Pode escrever sua mensagem aí embaixo — a nossa equipe
                    responde aqui mesmo. 😊
                  </p>
                )}
                {mensagens.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex",
                      m.de === "CLIENTE" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5",
                        m.de === "CLIENTE"
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
                          m.de === "CLIENTE"
                            ? "text-brand-200"
                            : "text-stone-400",
                        )}
                      >
                        {horaMensagem(m.criadaEm)}
                      </p>
                    </div>
                  </div>
                ))}
                {status === "ENCERRADO" && (
                  <p className="rounded-xl bg-stone-200 px-4 py-2.5 text-center text-sm font-medium text-stone-700">
                    A equipe encerrou esta conversa. Se precisar, é só escrever
                    de novo que ela continua daqui. 😉
                  </p>
                )}
              </div>
              <div className="flex items-end gap-2 border-t-2 border-stone-200 bg-white p-3">
                <Textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={aoDigitar}
                  rows={2}
                  maxLength={2000}
                  placeholder="Escreva sua mensagem…"
                  aria-label="Sua mensagem"
                  className="min-h-12 flex-1 resize-none"
                />
                <Button
                  onClick={() => void enviar()}
                  disabled={enviando || texto.trim() === ""}
                  aria-label="Enviar mensagem"
                  className="min-h-14 shrink-0 px-4"
                >
                  <Send className="size-6" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
