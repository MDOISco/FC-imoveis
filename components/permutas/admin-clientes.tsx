"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Home, RotateCcw, Trash2 } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import {
  labelOf,
  LEAD_OBJETIVO_BADGE_CLASSES,
  LEAD_OBJETIVO_OPTIONS,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";

export type ClienteImovelItem = {
  id: string;
  refCode: string;
  objetivo: "PERMUTAR" | "VENDER" | "ALUGAR";
  typeLabel: string;
  location: string;
  specs: string;
  status: string; // ATIVO | DESATIVADO | REPROVADO
  leadName: string;
  leadWhatsapp: string;
  painelUrl: string | null; // link privado do cliente (para reenviar se ele perder)
  thumbUrl: string | null;
  createdAt: string;
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ATIVO: { label: "No ar", className: "bg-brand-100 text-brand-900" },
  DESATIVADO: { label: "Fora do ar", className: "bg-stone-200 text-stone-700" },
  REPROVADO: { label: "Reprovado", className: "bg-red-100 text-red-900" },
};

/** Imóveis cadastrados pelos clientes depois da fila de aprovação. */
export function AdminClientes({ items }: { items: ClienteImovelItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(
    id: string,
    action: "desativar" | "reativar" | "reanalisar" | "excluir",
  ) {
    setBusy(id);
    try {
      await apiFetch(`/api/permutas/admin/clientes/${id}`, {
        method: "POST",
        body: { action },
      });
      toast(
        action === "excluir"
          ? "Cadastro excluído. Ele saiu do site na hora."
          : action === "desativar"
            ? "Imóvel tirado do ar. Ele não aparece mais na página pública."
            : action === "reanalisar"
              ? "Cadastro voltou para a fila de Aprovações."
              : "Imóvel publicado de novo.",
      );
      router.refresh();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Falha ao salvar.", "erro");
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Home className="size-12" />}
        title="Nenhum imóvel de cliente por aqui"
        description="Depois que a equipe aprova (ou reprova) um cadastro feito na página de Permutas, ele fica listado aqui para tirar do ar, republicar ou excluir."
      />
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const badge = STATUS_BADGE[item.status] ?? {
          label: item.status,
          className: "bg-stone-200 text-stone-800",
        };
        return (
          <div
            key={item.id}
            className="flex flex-col gap-4 rounded-2xl border-2 border-stone-200 bg-white p-5 lg:flex-row lg:items-center"
          >
            {item.thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.thumbUrl}
                alt=""
                className="aspect-[4/3] w-full rounded-xl object-cover lg:w-40"
              />
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-stone-100 text-3xl lg:w-40">
                🏠
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={badge.className}>{badge.label}</Badge>
                <Badge className={LEAD_OBJETIVO_BADGE_CLASSES[item.objetivo]}>
                  {labelOf(LEAD_OBJETIVO_OPTIONS, item.objetivo)}
                </Badge>
                <span className="text-base text-stone-500">
                  cadastrado em {item.createdAt}
                </span>
              </div>
              <p className="mt-1 text-lg font-bold text-stone-900">
                {item.refCode} · {item.typeLabel} · {item.location}
              </p>
              <p className="text-base text-stone-600">{item.specs}</p>
              <p className="mt-1 text-base text-stone-600">
                Dono: <strong>{item.leadName}</strong> ({item.leadWhatsapp})
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.status === "ATIVO" && (
                <Button
                  variant="secondary"
                  disabled={busy === item.id}
                  onClick={() => act(item.id, "desativar")}
                >
                  <EyeOff className="size-5" /> Tirar do ar
                </Button>
              )}
              {item.status === "REPROVADO" && (
                <Button
                  disabled={busy === item.id}
                  onClick={() => act(item.id, "reanalisar")}
                >
                  <RotateCcw className="size-5" /> Revisar de novo
                </Button>
              )}
              {item.status === "DESATIVADO" && (
                <Button
                  disabled={busy === item.id}
                  onClick={() => act(item.id, "reativar")}
                >
                  <Eye className="size-5" /> Publicar de novo
                </Button>
              )}
              {item.painelUrl && (
                <CopyButton
                  text={`${typeof window !== "undefined" ? window.location.origin : ""}${item.painelUrl}`}
                  label="Copiar link do cliente"
                />
              )}
              <ConfirmButton
                title="Excluir este cadastro?"
                message={`O imóvel ${item.refCode} de ${item.leadName} será apagado de vez, com fotos, curtidas e matches. Não dá para desfazer.`}
                confirmLabel="Sim, excluir"
                onConfirm={() => act(item.id, "excluir")}
              >
                <Trash2 className="size-5" /> Excluir
              </ConfirmButton>
            </div>
          </div>
        );
      })}
    </div>
  );
}
