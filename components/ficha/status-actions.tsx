"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";

/** Ações de situação do imóvel na ficha (Reservar, Vendido, Excluir…). */
export function StatusActions({
  propertyId,
  status,
}: {
  propertyId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(next: string, message: string) {
    setBusy(true);
    try {
      await apiFetch(`/api/imoveis/${propertyId}`, {
        method: "PATCH",
        body: { status: next },
      });
      toast(message);
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError) {
        const pend = (e.details as { pendencias?: string[] })?.pendencias;
        toast(pend?.length ? `${e.message} ${pend[0]}` : e.message, "erro");
      } else {
        toast("Não foi possível mudar a situação.", "erro");
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    await apiFetch(`/api/imoveis/${propertyId}`, { method: "DELETE" });
    toast("Imóvel excluído.");
    router.push("/painel");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/imoveis/${propertyId}/editar?etapa=1`}
        className={buttonClasses("secondary", "md")}
      >
        <Pencil className="size-5" /> Editar
      </Link>
      {status === "ATIVO" && (
        <>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => setStatus("RESERVADO", "Imóvel reservado.")}
          >
            Reservar
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => setStatus("VENDIDO", "Parabéns pela venda! 🎉")}
          >
            Marcar vendido
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => setStatus("ALUGADO", "Parabéns pela locação! 🎉")}
          >
            Marcar alugado
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              setStatus("DESATIVADO", "Imóvel desativado (sai dos anúncios).")
            }
          >
            Desativar
          </Button>
        </>
      )}
      {["RESERVADO", "VENDIDO", "ALUGADO", "DESATIVADO"].includes(status) && (
        <Button
          disabled={busy}
          onClick={() =>
            setStatus("ATIVO", "Imóvel reativado e de volta aos anúncios.")
          }
        >
          Reativar anúncio
        </Button>
      )}
      {status === "RASCUNHO" && (
        <Link
          href={`/imoveis/${propertyId}/editar?etapa=8`}
          className={buttonClasses("gold", "md")}
        >
          Revisar e publicar
        </Link>
      )}
      <ConfirmButton
        title="Excluir este imóvel?"
        message="Todas as informações, fotos e vídeo serão apagados de vez. Essa ação não tem volta."
        confirmLabel="Sim, excluir tudo"
        onConfirm={remove}
        className="text-red-700"
      >
        Excluir
      </ConfirmButton>
    </div>
  );
}
