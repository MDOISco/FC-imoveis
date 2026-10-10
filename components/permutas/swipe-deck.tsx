"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bath, BedDouble, Car, KeyRound, Ruler, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import { formatArea } from "@/lib/format";
import type { PublicProperty } from "@/lib/permutas/public-dto";
import { GoldenKeyMatch } from "./golden-key-match";
import { PedidoEndereco } from "./pedido-endereco";

/** Deck estilo Tinder: arraste a foto (ou use os botões) — 🔑 = interesse. */
export function SwipeDeck({
  token,
  defaults,
}: {
  token: string;
  defaults?: { name?: string; email?: string; phone?: string };
}) {
  const [cards, setCards] = useState<PublicProperty[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [match, setMatch] = useState<PublicProperty | null>(null);
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const fetchDeck = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ cards: PublicProperty[] }>(
        `/api/permutas/deck/${token}`,
      );
      setCards(data.cards);
    } catch (e) {
      toast(
        e instanceof ApiError ? e.message : "Não foi possível carregar.",
        "erro",
      );
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchDeck();
  }, [fetchDeck]);

  async function swipe(liked: boolean) {
    const top = cards?.[0];
    if (!top || leaving) return;
    setLeaving(liked ? "right" : "left");
    setTimeout(() => {
      setCards((prev) => (prev ? prev.slice(1) : prev));
      setLeaving(null);
      setDrag(null);
    }, 260);
    try {
      const res = await apiFetch<{
        match: boolean;
        matchedProperty?: PublicProperty;
      }>("/api/permutas/swipes", {
        method: "POST",
        body: { token, toPropertyId: top.id, liked },
      });
      if (res.match && res.matchedProperty) {
        setMatch(res.matchedProperty);
      }
    } catch (e) {
      toast(
        e instanceof ApiError ? e.message : "Não foi possível registrar.",
        "erro",
      );
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    startRef.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!startRef.current) return;
    setDrag({
      dx: e.clientX - startRef.current.x,
      dy: e.clientY - startRef.current.y,
    });
  }
  function onPointerUp() {
    if (!startRef.current) return;
    const dx = drag?.dx ?? 0;
    startRef.current = null;
    if (dx > 100) void swipe(true);
    else if (dx < -100) void swipe(false);
    else setDrag(null);
  }

  if (cards === null || (loading && cards.length === 0)) {
    return (
      <div className="flex min-h-72 items-center justify-center gap-3 text-lg text-stone-500">
        <Spinner className="size-7" /> Procurando imóveis para você…
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-stone-300 bg-stone-100 p-10 text-center">
        <p className="text-5xl">🏡</p>
        <h3 className="mt-3 text-xl font-bold text-stone-700">
          Por enquanto é só!
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-base text-stone-500">
          Você já viu todos os imóveis disponíveis para permuta. Volte em breve
          — novos imóveis entram toda semana.
        </p>
      </div>
    );
  }

  const top = cards[0];
  const area = top.usableArea ?? top.totalArea;
  const dx = leaving === "right" ? 600 : leaving === "left" ? -600 : (drag?.dx ?? 0);
  const rotate = dx / 22;
  const likeOpacity = Math.min(Math.max(dx / 100, 0), 1);
  const passOpacity = Math.min(Math.max(-dx / 100, 0), 1);

  return (
    <div className="mx-auto max-w-md">
      <div className="relative">
        {/* próxima carta ao fundo */}
        {cards[1] && (
          <div className="absolute inset-0 translate-y-2 scale-[0.97] overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm" />
        )}

        <div
          className={cn(
            "relative overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-lg",
            drag ? "swipe-card-dragging" : "transition-transform duration-300",
          )}
          style={{
            transform: `translateX(${dx}px) rotate(${rotate}deg)`,
          }}
        >
          <div
            className="relative aspect-[4/3] touch-none select-none bg-stone-200"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {top.photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={top.photos[0].webUrl}
                alt={top.title}
                className="size-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex size-full items-center justify-center text-6xl">
                🏠
              </div>
            )}
            <span
              className="absolute left-4 top-4 rounded-xl border-4 border-brand-500 px-3 py-1 text-2xl font-extrabold uppercase text-brand-500"
              style={{ opacity: likeOpacity, transform: "rotate(-12deg)" }}
            >
              🔑 Quero!
            </span>
            <span
              className="absolute right-4 top-4 rounded-xl border-4 border-red-500 px-3 py-1 text-2xl font-extrabold uppercase text-red-500"
              style={{ opacity: passOpacity, transform: "rotate(12deg)" }}
            >
              Passo
            </span>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pt-10 text-white">
              <p className="text-xl font-extrabold leading-tight">{top.title}</p>
              <p className="text-base text-white/85">📍 {top.location}</p>
              <p className="text-lg font-bold text-gold-300">{top.valueLabel}</p>
            </div>
          </div>

          <div className="max-h-56 space-y-3 overflow-y-auto p-4">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-base text-stone-700">
              {top.bedrooms ? (
                <span className="inline-flex items-center gap-1">
                  <BedDouble className="size-4" /> {top.bedrooms} quartos
                </span>
              ) : null}
              {top.bathrooms ? (
                <span className="inline-flex items-center gap-1">
                  <Bath className="size-4" /> {top.bathrooms} banheiros
                </span>
              ) : null}
              {top.parking ? (
                <span className="inline-flex items-center gap-1">
                  <Car className="size-4" /> {top.parking} vagas
                </span>
              ) : null}
              {area ? (
                <span className="inline-flex items-center gap-1">
                  <Ruler className="size-4" /> {formatArea(area)}
                </span>
              ) : null}
            </div>
            {top.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {top.amenities.slice(0, 8).map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-stone-100 px-2.5 py-0.5 text-sm font-semibold text-stone-600"
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}
            {top.description && (
              <p className="whitespace-pre-line text-base leading-relaxed text-stone-600">
                {top.description}
              </p>
            )}
            <p className="text-sm font-semibold text-stone-400">
              {top.sourceLabel} · ref. {top.refCode}
            </p>
            <PedidoEndereco
              propertyId={top.id}
              token={token}
              defaults={defaults}
            />
          </div>
        </div>
      </div>

      {/* botões grandes */}
      <div className="mt-5 flex items-center justify-center gap-8">
        <button
          type="button"
          aria-label="Não tenho interesse"
          onClick={() => swipe(false)}
          className="flex size-18 h-18 w-18 items-center justify-center rounded-full border-4 border-red-200 bg-white text-red-500 shadow-md transition-transform hover:scale-105"
          style={{ width: 72, height: 72 }}
        >
          <X className="size-9" />
        </button>
        <button
          type="button"
          aria-label="Tenho interesse na troca"
          onClick={() => swipe(true)}
          className="flex items-center justify-center rounded-full border-4 border-gold-300 bg-gold-400 text-gold-950 shadow-lg transition-transform hover:scale-105"
          style={{ width: 88, height: 88 }}
        >
          <KeyRound className="size-11" />
        </button>
      </div>
      <p className="mt-3 text-center text-base text-stone-500">
        Arraste a foto para o lado ou use os botões · 🔑 = tenho interesse
      </p>

      {match && (
        <GoldenKeyMatch
          propertyTitle={match.title}
          propertyLocation={match.location}
          photoUrl={match.photos[0]?.webUrl ?? null}
          onClose={() => setMatch(null)}
        />
      )}
    </div>
  );
}
