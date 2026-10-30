import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Step1Basico } from "@/components/wizard/step-1-basico";
import { WIZARD_STEPS } from "@/components/wizard/steps";
import { Card } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Cadastrar imóvel" };

export default async function NovoImovelPage() {
  const brokers = await db.broker.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/painel"
          className="inline-flex items-center gap-1.5 text-base font-semibold text-stone-500 hover:text-brand-800"
        >
          <ArrowLeft className="size-5" /> Voltar ao painel
        </Link>
        <h1 className="mt-1 text-2xl font-extrabold text-stone-900">
          Cadastrar imóvel
        </h1>
        <p className="mt-1 text-base text-stone-500">
          Um passo de cada vez. Tudo é salvo como rascunho — você pode parar e
          continuar depois.
        </p>
      </div>

      <Stepper steps={WIZARD_STEPS} current={1} />

      <Card className="p-6 sm:p-8">
        <Step1Basico
          property={null}
          brokers={brokers.map((b) => ({ value: b.id, label: b.name }))}
          mode="create"
        />
      </Card>
    </div>
  );
}
