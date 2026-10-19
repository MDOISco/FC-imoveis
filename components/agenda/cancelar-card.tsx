"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmButton } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";

/** Botão "Cancelar visita" do cliente, com confirmação clara. */
export function CancelarCard({
  token,
  quando,
}: {
  token: string;
  quando: string;
}) {
  const router = useRouter();
  const [cancelado, setCancelado] = useState(false);

  if (cancelado) {
    return (
      <p className="rounded-2xl bg-stone-100 px-5 py-4 text-center text-lg font-semibold text-stone-700">
        Visita cancelada. Se mudar de ideia, é só agendar de novo.
      </p>
    );
  }

  return (
    <ConfirmButton
      title="Cancelar esta visita?"
      message={`A visita de ${quando} será cancelada e o horário ficará livre para outras pessoas. Se puder, desmarque sempre com antecedência — a agenda é combinada com o cliente e com o proprietário do imóvel.`}
      confirmLabel="Sim, cancelar visita"
      cancelLabel="Voltar"
      className="w-full"
      onConfirm={async () => {
        try {
          await apiFetch(`/api/agenda/cancelar/${token}`, { method: "POST" });
          toast("Visita cancelada.");
          setCancelado(true);
          router.refresh();
        } catch (e) {
          toast(
            e instanceof ApiError ? e.message : "Não foi possível cancelar.",
            "erro",
          );
        }
      }}
    >
      Cancelar visita
    </ConfirmButton>
  );
}
