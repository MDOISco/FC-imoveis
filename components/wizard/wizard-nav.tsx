"use client";

import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/** Rodapé padrão das etapas: Voltar · Salvar rascunho · Continuar. */
export function WizardNav({
  propertyId,
  step,
  saving,
  savedAt,
  onSaveDraft,
  continueLabel = "Continuar",
  lastStep = false,
}: {
  propertyId: string;
  step: number;
  saving: boolean;
  savedAt: Date | null;
  onSaveDraft: () => void;
  continueLabel?: string;
  lastStep?: boolean;
}) {
  const router = useRouter();
  return (
    <div className="mt-8 border-t-2 border-stone-100 pt-6">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {step > 1 && (
            <Button
              variant="ghost"
              size="lg"
              disabled={saving}
              onClick={() =>
                router.push(`/imoveis/${propertyId}/editar?etapa=${step - 1}`)
              }
            >
              <ArrowLeft className="size-5" /> Voltar
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {savedAt && !saving && (
            <span className="text-sm font-medium text-brand-700">
              ✓ Rascunho salvo às{" "}
              {savedAt.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <Button
            variant="secondary"
            size="lg"
            disabled={saving}
            onClick={onSaveDraft}
          >
            <Save className="size-5" /> Salvar rascunho
          </Button>
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? (
              <Spinner className="border-white/40 border-t-white" />
            ) : (
              <>
                {continueLabel}
                {!lastStep && <ArrowRight className="size-5" />}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
