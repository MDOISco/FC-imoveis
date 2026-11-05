"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Revela o conteúdo com uma entrada suave quando a seção aparece na rolagem.
 * O que já está na tela ao carregar NÃO é escondido (sem "piscada"); com
 * "reduzir movimento" ligado, tudo fica visível direto.
 */
export function RevelaAoRolar({
  children,
  className,
  atraso = 0,
}: {
  children: React.ReactNode;
  className?: string;
  atraso?: number; // ms antes da entrada
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [escondido, setEscondido] = useState(false);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return; // fica visível, sem animação
    }
    // Só esconde o que ainda está ABAIXO da tela.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    setEscondido(true);
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisivel(true);
            obs.disconnect();
          }
        }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        escondido && !visivel && "opacity-0",
        escondido && visivel && "anim-entra",
        className,
      )}
      style={visivel && atraso ? { animationDelay: `${atraso}ms` } : undefined}
    >
      {children}
    </div>
  );
}
