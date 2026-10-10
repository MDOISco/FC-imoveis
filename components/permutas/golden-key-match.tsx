"use client";

import { Button } from "@/components/ui/button";

/** A chave dourada: animação de match da permuta. */
export function GoldenKeySvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      {/* brilho dourado */}
      <g className="anim-brilho" style={{ transformOrigin: "100px 100px" }}>
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * Math.PI) / 4;
          const x1 = 100 + Math.cos(angle) * 55;
          const y1 = 100 + Math.sin(angle) * 55;
          const x2 = 100 + Math.cos(angle) * 85;
          const y2 = 100 + Math.sin(angle) * 85;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#e6ad22"
              strokeWidth="6"
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* cadeado */}
      <g>
        {/* alça (abre com a animação) */}
        <path
          className="anim-cadeado"
          d="M70 92 v-18 a30 30 0 0 1 60 0 v18"
          stroke="#78716c"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* corpo */}
        <rect
          x="58"
          y="90"
          width="84"
          height="66"
          rx="12"
          fill="#1d5c42"
          stroke="#153d2e"
          strokeWidth="4"
        />
        {/* fechadura */}
        <circle cx="100" cy="118" r="9" fill="#0a221a" />
        <rect x="96" y="120" width="8" height="18" rx="3" fill="#0a221a" />
      </g>

      {/* chave dourada girando */}
      <g className="anim-chave">
        <circle
          cx="138"
          cy="70"
          r="16"
          stroke="#e6ad22"
          strokeWidth="9"
          fill="none"
        />
        <line
          x1="127"
          y1="81"
          x2="98"
          y2="110"
          stroke="#e6ad22"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <line
          x1="106"
          y1="102"
          x2="112"
          y2="112"
          stroke="#e6ad22"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <line
          x1="98"
          y1="110"
          x2="106"
          y2="118"
          stroke="#e6ad22"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/** Overlay de celebração: “a chave dourada se abre”. */
export function GoldenKeyMatch({
  propertyTitle,
  propertyLocation,
  photoUrl,
  onClose,
}: {
  propertyTitle: string;
  propertyLocation: string;
  photoUrl: string | null;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-gradient-to-b from-brand-950/95 to-black/95 p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Deu match!"
    >
      <div className="anim-match-pop w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        <GoldenKeySvg className="mx-auto size-40" />
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gold-600">
          🔑 DEU MATCH!
        </h2>
        <p className="mt-2 text-lg font-semibold text-stone-800">
          Vocês dois têm interesse na troca!
        </p>
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={propertyTitle}
            className="mx-auto mt-4 aspect-[16/10] w-full rounded-2xl object-cover"
          />
        )}
        <p className="mt-3 text-base font-bold text-stone-900">
          {propertyTitle}
        </p>
        <p className="text-base text-stone-500">{propertyLocation}</p>
        <p className="mt-4 rounded-xl bg-brand-50 p-3 text-base text-brand-900">
          A equipe da FC Imóveis vai entrar em contato com vocês para conduzir a
          permuta com segurança.
        </p>
        <Button size="lg" className="mt-5 w-full" onClick={onClose}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
