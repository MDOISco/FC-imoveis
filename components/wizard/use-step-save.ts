"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/client-api";
import { toast } from "@/components/ui/toast";

/** Salvamento das etapas do wizard: Continuar (salva e avança) e Salvar rascunho. */
export function useStepSave(propertyId: string) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  async function save(
    data: Record<string, unknown>,
    completedStep: number,
    options?: { goTo?: number | "ficha" },
  ): Promise<boolean> {
    setSaving(true);
    try {
      await apiFetch(`/api/imoveis/${propertyId}`, {
        method: "PATCH",
        body: { data, wizardStep: completedStep },
      });
      setSavedAt(new Date());
      if (options?.goTo === "ficha") {
        router.push(`/imoveis/${propertyId}`);
      } else if (options?.goTo) {
        router.push(`/imoveis/${propertyId}/editar?etapa=${options.goTo}`);
      }
      router.refresh();
      return true;
    } catch (e) {
      toast(
        e instanceof ApiError ? e.message : "Não foi possível salvar.",
        "erro",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  return { save, saving, savedAt };
}

/** Avisa antes de sair da página com alterações não salvas. */
export function useDirtyGuard(dirty: boolean) {
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);
}
