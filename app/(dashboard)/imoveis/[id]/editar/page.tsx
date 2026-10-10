import { notFound } from "next/navigation";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { toWizardProperty } from "@/lib/wizard-dto";

export const dynamic = "force-dynamic";

export const metadata = { title: "Editar imóvel" };

export default async function EditarImovelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ etapa?: string }>;
}) {
  const { id } = await params;
  const { etapa } = await searchParams;

  const [property, brokers, settings] = await Promise.all([
    db.property.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { position: "asc" } },
        video: true,
        publications: true,
      },
    }),
    db.broker.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getSettings(),
  ]);

  if (!property) notFound();

  const step = Math.min(Math.max(Number(etapa) || 1, 1), 8);

  return (
    <WizardShell
      property={toWizardProperty(property)}
      brokers={brokers.map((b) => ({ value: b.id, label: b.name }))}
      step={step}
      watermarkDefault={settings.watermarkDefault}
    />
  );
}
