"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import { formatDate } from "@/lib/format";

export type InteresseItem = {
  swipeId: string;
  createdAt: string;
  leadName: string;
  leadWhatsapp: string;
  leadPropertyLabel: string; // "Casa · Jardim América (FC-0003)"
  targetId: string;
  targetLabel: string; // "FC-0002 · Apartamento no Centro"
  targetThumb: string | null;
};

/** Curtidas de clientes em imóveis da carteira: aceitar abre a chave p/ o lead. */
export function AdminInteresses({ items }: { items: InteresseItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(swipeId: string, action: "aceitar" | "recusar") {
    setBusy(swipeId);
    try {
      const res = await apiFetch<{ match: boolean }>(
        `/api/permutas/admin/interesses/${swipeId}`,
        { method: "POST", body: { action } },
      );
      toast(
        res.match
          ? "Permuta aceita! A chave dourada abriu para o cliente. 🔑"
          : "Interesse recusado.",
      );
      router.refresh();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Falha ao registrar.", "erro");
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<KeyRound className="size-12" />}
        title="Nenhum interesse pendente"
        description="Quando um cliente curtir um imóvel da carteira marcado como permuta, ele aparece aqui para você aceitar em nome do proprietário."
      />
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.swipeId}
          className="flex flex-col gap-4 rounded-2xl border-2 border-stone-200 bg-white p-5 lg:flex-row lg:items-center"
        >
          {item.targetThumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.targetThumb}
              alt=""
              className="aspect-[4/3] w-full rounded-xl object-cover lg:w-40"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-stone-100 text-3xl lg:w-40">
              🏠
            </div>
          )}
          <div className="flex-1">
            <p className="text-base text-stone-500">
              {formatDate(item.createdAt)} — <strong>{item.leadName}</strong> (
              {item.leadWhatsapp}) tem interesse em:
            </p>
            <Link
              href={`/imoveis/${item.targetId}`}
              className="text-lg font-bold text-brand-800 hover:underline"
            >
              {item.targetLabel}
            </Link>
            <p className="mt-1 text-base text-stone-600">
              Oferece na troca: <strong>{item.leadPropertyLabel}</strong>
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              disabled={busy === item.swipeId}
              onClick={() => act(item.swipeId, "aceitar")}
            >
              <Check className="size-5" /> Aceitar permuta
            </Button>
            <Button
              variant="secondary"
              disabled={busy === item.swipeId}
              onClick={() => act(item.swipeId, "recusar")}
            >
              <X className="size-5" /> Recusar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
