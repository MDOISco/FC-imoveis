"use client";

import { useEffect, useRef } from "react";

/**
 * Vídeo de fundo com autoplay robusto no CELULAR.
 *
 * Só os atributos (autoplay/muted/loop/playsinline) não bastam: navegadores
 * dentro de apps (Instagram/Facebook), o Modo de Economia de Energia do iPhone
 * e a Economia de Dados do Android recusam o autoplay. Então:
 *  - forçamos `muted` pela propriedade (não só pelo atributo) e chamamos play();
 *  - tentamos de novo quando o vídeo fica pronto e quando entra na tela;
 *  - se ainda assim recusarem, o primeiro toque/rolagem na página dá play.
 * Se nada funcionar (ex.: Economia de Energia), fica o poster — sem tela preta.
 */
export function HeroVideo({
  webm,
  mp4,
  poster,
  className,
}: {
  webm: string;
  mp4: string;
  poster: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    const tentarTocar = () => {
      v.muted = true; // iOS só deixa tocar sem som
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    tentarTocar();
    v.addEventListener("canplay", tentarTocar);
    v.addEventListener("loadeddata", tentarTocar);

    // Toca quando o banner aparece na tela (ajuda com Economia de Dados).
    let obs: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      obs = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.isIntersecting && tentarTocar()),
        { threshold: 0.2 },
      );
      obs.observe(v);
    }

    // Último recurso: primeira interação do usuário na página.
    const noPrimeiroToque = () => {
      tentarTocar();
      remover();
    };
    const remover = () => {
      document.removeEventListener("touchstart", noPrimeiroToque);
      document.removeEventListener("click", noPrimeiroToque);
      document.removeEventListener("scroll", noPrimeiroToque);
    };
    document.addEventListener("touchstart", noPrimeiroToque, { passive: true });
    document.addEventListener("click", noPrimeiroToque);
    document.addEventListener("scroll", noPrimeiroToque, { passive: true });

    return () => {
      v.removeEventListener("canplay", tentarTocar);
      v.removeEventListener("loadeddata", tentarTocar);
      obs?.disconnect();
      remover();
    };
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      webkit-playsinline="true"
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
    >
      <source src={webm} type="video/webm" />
      <source src={mp4} type="video/mp4" />
    </video>
  );
}
