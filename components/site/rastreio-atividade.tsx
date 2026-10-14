"use client";

import { useEffect } from "react";
import type { VisitEventType, VisitOrigin } from "@/lib/atividade";

/** Nome do evento que a galeria dispara ao dar play no vídeo. */
export const EVENTO_ATIVIDADE = "fc:atividade";

/** Dispara um evento de atividade de qualquer componente de cliente. */
export function registrarAtividade(tipo: VisitEventType, rotulo?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(EVENTO_ATIVIDADE, { detail: { tipo, rotulo } }),
  );
}

const PULSO_MS = 20_000;
const MAX_EVENTOS_NAVEGADOR = 120;

/**
 * Registro silencioso da visita do cliente na página do imóvel: abertura,
 * tempo com a aba visível, até onde rolou e os cliques. Não renderiza nada.
 *
 * - Cliques: qualquer elemento com data-atividade="WHATSAPP|AGENDAR|FOTO"
 *   (e data-rotulo opcional) — delegação, funciona em componentes de servidor.
 * - Seções: elementos com data-secao="Nome" contam como vistas ao aparecer
 *   na tela (uma vez cada).
 * - Vídeo: a galeria chama registrarAtividade("VIDEO").
 */
export function RastreioAtividade(
  props:
    | { origem: "EXCLUSIVO"; token: string }
    | { origem: "SITE"; imovelId: string },
) {
  const origem: VisitOrigin = props.origem;
  const chave = props.origem === "EXCLUSIVO" ? props.token : props.imovelId;

  useEffect(() => {
    let visitaId: string | null = null;
    let segundos = 0;
    let rolagemMax = 0;
    let enviados = 0;
    let ultimoPulso = { segundos: -1, rolagem: -1 };
    let ativo = true;
    const fila: { tipo: VisitEventType; rotulo?: string }[] = [];
    const secoesVistas = new Set<string>();
    const storageKey = `fc_visita_${origem}_${chave}`;

    function enviar(corpo: Record<string, unknown>, beacon = false) {
      const json = JSON.stringify(corpo);
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/atividade",
          new Blob([json], { type: "application/json" }),
        );
        return Promise.resolve(null);
      }
      return fetch("/api/atividade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json,
        keepalive: true,
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
    }

    function registrar(tipo: VisitEventType, rotulo?: string) {
      if (enviados >= MAX_EVENTOS_NAVEGADOR) return;
      if (!visitaId) {
        fila.push({ tipo, rotulo });
        return;
      }
      enviados += 1;
      void enviar({ acao: "evento", visitaId, tipo, rotulo });
    }

    function pulso(beacon = false) {
      if (!visitaId) return;
      if (
        ultimoPulso.segundos === segundos &&
        ultimoPulso.rolagem === rolagemMax
      ) {
        return;
      }
      ultimoPulso = { segundos, rolagem: rolagemMax };
      void enviar(
        { acao: "pulso", visitaId, segundos, rolagem: rolagemMax },
        beacon,
      );
    }

    // --- abertura (reaproveita a visita se a página foi só recarregada) ---
    let anterior: string | null = null;
    try {
      anterior = sessionStorage.getItem(storageKey);
    } catch {
      // navegação privada etc.
    }
    const corpoAbrir =
      props.origem === "EXCLUSIVO"
        ? { acao: "abrir", origem, token: props.token, visitaAnterior: anterior }
        : { acao: "abrir", origem, imovelId: props.imovelId, visitaAnterior: anterior };
    void enviar(corpoAbrir).then((resp) => {
      if (!ativo) return;
      const id = (resp as { visitaId?: string | null } | null)?.visitaId;
      if (!id) return; // equipe, link inválido ou freio — não registra nada
      visitaId = id;
      try {
        sessionStorage.setItem(storageKey, id);
      } catch {
        // sem storage: segue sem reaproveitar
      }
      for (const e of fila.splice(0)) registrar(e.tipo, e.rotulo);
      medirRolagem();
      pulso();
    });

    // --- tempo com a aba visível ---
    const relogio = window.setInterval(() => {
      if (document.visibilityState === "visible") segundos += 1;
    }, 1_000);
    const pulsoTimer = window.setInterval(() => pulso(), PULSO_MS);

    // --- rolagem máxima (percentual da página) ---
    function medirRolagem() {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      const pct =
        total <= 0
          ? 100
          : Math.min(100, Math.round(((window.scrollY + 1) / total) * 100));
      if (pct > rolagemMax) rolagemMax = pct;
    }
    window.addEventListener("scroll", medirRolagem, { passive: true });

    // --- cliques marcados com data-atividade ---
    function aoClicar(e: MouseEvent) {
      const alvo = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-atividade]",
      );
      if (!alvo) return;
      const tipo = alvo.dataset.atividade;
      if (tipo === "WHATSAPP" || tipo === "AGENDAR" || tipo === "FOTO") {
        registrar(tipo, alvo.dataset.rotulo);
      }
    }
    document.addEventListener("click", aoClicar, true);

    // --- eventos vindos de componentes de cliente (vídeo) ---
    function aoEvento(e: Event) {
      const d = (e as CustomEvent<{ tipo: VisitEventType; rotulo?: string }>)
        .detail;
      if (d?.tipo) registrar(d.tipo, d.rotulo);
    }
    window.addEventListener(EVENTO_ATIVIDADE, aoEvento);

    // --- seções vistas ---
    let observer: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const nome = (entry.target as HTMLElement).dataset.secao;
            if (!nome || secoesVistas.has(nome)) continue;
            secoesVistas.add(nome);
            registrar("SECAO", nome);
          }
        },
        { threshold: 0.4 },
      );
      document
        .querySelectorAll<HTMLElement>("[data-secao]")
        .forEach((el) => observer!.observe(el));
    }

    // --- saída da página: último pulso garantido ---
    function aoEsconder() {
      if (document.visibilityState === "hidden") pulso(true);
    }
    const aoSair = () => pulso(true);
    document.addEventListener("visibilitychange", aoEsconder);
    window.addEventListener("pagehide", aoSair);

    return () => {
      ativo = false;
      window.clearInterval(relogio);
      window.clearInterval(pulsoTimer);
      window.removeEventListener("scroll", medirRolagem);
      document.removeEventListener("click", aoClicar, true);
      window.removeEventListener(EVENTO_ATIVIDADE, aoEvento);
      document.removeEventListener("visibilitychange", aoEsconder);
      window.removeEventListener("pagehide", aoSair);
      observer?.disconnect();
      pulso(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origem, chave]);

  return null;
}
