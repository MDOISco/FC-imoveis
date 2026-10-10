"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import { formatDateTime } from "@/lib/format";

export type PedidoEnderecoItem = {
  id: string;
  createdAt: string;
  status: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  propertyLabel: string;
  fullAddress: string; // endereço interno completo, só para a equipe
};

/** Pedidos de localização exata — a equipe retorna o contato. */
export function AdminEnderecos({ items }: { items: PedidoEnderecoItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<MapPin className="size-12" />}
        title="Nenhum pedido de endereço"
        description="Quando alguém pedir a localização exata de um imóvel no site, o contato aparece aqui para a equipe retornar."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((p) => (
        <div
          key={p.id}
          className={`flex flex-col gap-3 rounded-2xl border-2 bg-white p-5 sm:flex-row sm:items-center sm:justify-between ${
            p.status === "NOVO" ? "border-blue-200" : "border-stone-200 opacity-70"
          }`}
        >
          <div>
            <p className="flex flex-wrap items-center gap-2">
              <Badge
                className={
                  p.status === "NOVO"
                    ? "bg-blue-100 text-blue-900"
                    : "bg-stone-200 text-stone-600"
                }
              >
                {p.status === "NOVO" ? "Novo" : "Contatado"}
              </Badge>
              <span className="text-sm text-stone-400">
                {formatDateTime(p.createdAt)}
              </span>
            </p>
            <p className="mt-1.5 text-lg font-bold text-stone-900">
              {p.name} · {p.phone}
            </p>
            <p className="text-base text-stone-600">{p.email}</p>
            <p className="mt-1 text-base text-stone-600">
              Quer a localização de:{" "}
              <Link
                href={`/imoveis/${p.propertyId}`}
                className="font-semibold text-brand-800 hover:underline"
              >
                {p.propertyLabel}
              </Link>
            </p>
            <p className="mt-1 rounded-lg bg-stone-50 px-3 py-1.5 text-base text-stone-700">
              📍 {p.fullAddress || "Endereço não cadastrado"}
            </p>
          </div>
          {p.status === "NOVO" && (
            <Button
              variant="secondary"
              disabled={busy === p.id}
              onClick={async () => {
                setBusy(p.id);
                try {
                  await apiFetch(`/api/permutas/admin/pedidos-endereco/${p.id}`, {
                    method: "PATCH",
                    body: { status: "CONTATADO" },
                  });
                  toast("Marcado como contatado.");
                  router.refresh();
                } catch (e) {
                  toast(
                    e instanceof ApiError ? e.message : "Falha ao atualizar.",
                    "erro",
                  );
                } finally {
                  setBusy(null);
                }
              }}
            >
              ✓ Marcar como contatado
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
