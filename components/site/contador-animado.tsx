"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Número que "sobe" de 0 até o valor quando entra na tela (faixa de números
 * do banner). Com "reduzir movimento" ligado, mostra o valor direto.
 */
export function ContadorAnimado({
  valor,
  duracao = 1400,
}: {
  valor: number;
  duracao?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [mostrado, setMostrado] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      valor <= 0 ||
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setMostrado(valor);
      return;
    }

    let raf = 0;
    const animar = () => {
      const inicio = performance.now();
      const passo = (agora: number) => {
        const p = Math.min(1, (agora - inicio) / duracao);
        const suave = 1 - Math.pow(1 - p, 3); // desacelera no final
        setMostrado(Math.round(valor * suave));
        if (p < 1) raf = requestAnimationFrame(passo);
      };
      raf = requestAnimationFrame(passo);
    };

    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animar();
            obs.disconnect();
          }
        }),
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [valor, duracao]);

  return <span ref={ref}>{mostrado}</span>;
}
