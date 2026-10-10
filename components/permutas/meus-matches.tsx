"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import type { PublicProperty } from "@/lib/permutas/public-dto";
import { GoldenKeyMatch, GoldenKeySvg } from "./golden-key-match";

export type MatchItem = {
  id: string;
  createdAt: string;
  seen: boolean;
  property: PublicProperty;
};

/** Lista de matches do lead; matches novos abrem a chave dourada uma vez. */
export function MeusMatches({
  matches,
  token,
}: {
  matches: MatchItem[];
  token: string;
}) {
  const router = useRouter();
  const unseen = matches.filter((m) => !m.seen);
  const [celebrating, setCelebrating] = useState<MatchItem | null>(
    unseen[0] ?? null,
  );

  useEffect(() => {
    if (unseen.length > 0) {
      void apiFetch("/api/permutas/matches-vistos", {
        method: "POST",
        body: { token },
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (matches.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-stone-300 bg-stone-100 p-10 text-center">
        <GoldenKeySvg className="mx-auto size-28 opacity-50" />
        <h3 className="mt-2 text-xl font-bold text-stone-700">
          Nenhum match ainda
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-base text-stone-500">
          Continue explorando os imóveis! Quando os dois lados tiverem
          interesse, a chave dourada se abre. 🔑
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((m) => (
        <div
          key={m.id}
          className="flex flex-col gap-4 rounded-2xl border-2 border-gold-300 bg-gold-50 p-4 sm:flex-row sm:items-center"
        >
          {m.property.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={m.property.photos[0].thumbUrl}
              alt={m.property.title}
              className="aspect-[4/3] w-full rounded-xl object-cover sm:w-44"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-stone-200 text-4xl sm:w-44">
              🏠
            </div>
          )}
          <div className="flex-1">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-3 py-1 text-sm font-extrabold text-gold-950">
              <KeyRound className="size-4" /> MATCH · {formatDate(m.createdAt)}
            </p>
            <h3 className="mt-2 text-lg font-bold text-stone-900">
              {m.property.title}
            </h3>
            <p className="text-base text-stone-600">
              📍 {m.property.location} · {m.property.valueLabel}
            </p>
            <p className="mt-2 rounded-xl bg-white/70 px-3 py-2 text-base text-brand-900">
              A equipe da FC Imóveis vai entrar em contato com vocês para
              conduzir a conversa. 🤝
            </p>
          </div>
        </div>
      ))}

      {celebrating && (
        <GoldenKeyMatch
          propertyTitle={celebrating.property.title}
          propertyLocation={celebrating.property.location}
          photoUrl={celebrating.property.photos[0]?.webUrl ?? null}
          onClose={() => {
            setCelebrating(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
