"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";

/**
 * Exclui um rascunho direto do painel, sem abrir o cadastro.
 * `compact` = só o ícone (usado na lista); senão vira botão com texto (card).
 */
export function DeleteDraftButton({
  propertyId,
  refCode,
  compact = false,
  className = "",
}: {
  propertyId: string;
  refCode: string;
  compact?: boolean;
  className?: string;
}) {
  const router = useRouter();

  async function remover() {
    try {
      await apiFetch(`/api/imoveis/${propertyId}`, { method: "DELETE" });
      toast("Rascunho excluído.");
      router.refresh();
    } catch (e) {
      toast(
        e instanceof ApiError ? e.message : "Não foi possível excluir.",
        "erro",
      );
    }
  }

  return (
    <ConfirmButton
      title="Excluir este rascunho?"
      message={`O rascunho ${refCode} e as fotos já enviadas serão apagados de vez. Essa ação não tem volta.`}
      confirmLabel="Sim, excluir rascunho"
      onConfirm={remover}
      className={`text-red-700 ${className}`}
    >
      <Trash2 className={compact ? "size-4" : "size-5"} />
      {!compact && "Excluir rascunho"}
    </ConfirmButton>
  );
}
