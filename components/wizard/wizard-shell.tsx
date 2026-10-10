"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import type { Option } from "@/lib/constants";
import type { WizardProperty } from "@/lib/wizard-dto";
import { Step1Basico } from "./step-1-basico";
import { Step2Endereco } from "./step-2-endereco";
import { Step3Caracteristicas } from "./step-3-caracteristicas";
import { Step4Comodidades } from "./step-4-comodidades";
import { Step5Valores } from "./step-5-valores";
import { Step6Midia } from "./step-6-midia";
import { Step7Descricao } from "./step-7-descricao";
import { Step8Revisao } from "./step-8-revisao";
import { WIZARD_STEPS } from "./steps";

export function WizardShell({
  property,
  brokers,
  step,
  watermarkDefault,
}: {
  property: WizardProperty;
  brokers: Option[];
  step: number;
  watermarkDefault: boolean;
}) {
  const common = { property, step };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href={property.status === "RASCUNHO" ? "/" : `/imoveis/${property.id}`}
            className="inline-flex items-center gap-1.5 text-base font-semibold text-stone-500 hover:text-brand-800"
          >
            <ArrowLeft className="size-5" />
            {property.status === "RASCUNHO" ? "Voltar ao painel" : "Voltar à ficha"}
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold text-stone-900">
            {property.status === "RASCUNHO" ? "Cadastrar imóvel" : "Editar imóvel"}{" "}
            <span className="font-bold text-stone-400">· {property.refCode}</span>
          </h1>
        </div>
      </div>

      <Stepper steps={WIZARD_STEPS} current={step} />

      <Card className="p-6 sm:p-8">
        {step === 1 && <Step1Basico {...common} brokers={brokers} mode="edit" />}
        {step === 2 && <Step2Endereco {...common} />}
        {step === 3 && <Step3Caracteristicas {...common} />}
        {step === 4 && <Step4Comodidades {...common} />}
        {step === 5 && <Step5Valores {...common} />}
        {step === 6 && (
          <Step6Midia {...common} watermarkDefault={watermarkDefault} />
        )}
        {step === 7 && <Step7Descricao {...common} />}
        {step === 8 && <Step8Revisao {...common} />}
      </Card>
    </div>
  );
}
