"use client";

import { useMemo, useState } from "react";
import { CheckboxField } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/toast";
import { AMENITIES, AMENITY_CATEGORIES } from "@/lib/constants";
import type { WizardProperty } from "@/lib/wizard-dto";
import { useDirtyGuard, useStepSave } from "./use-step-save";
import { WizardNav } from "./wizard-nav";

export function Step4Comodidades({
  property,
}: {
  property: WizardProperty;
  step?: number;
}) {
  const initial = useMemo(() => [...property.amenities].sort(), [property]);
  const [selected, setSelected] = useState<string[]>(property.amenities);
  const { save, saving, savedAt } = useStepSave(property.id);
  const dirty =
    JSON.stringify([...selected].sort()) !== JSON.stringify(initial);
  useDirtyGuard(dirty && !saving);

  function toggle(key: string) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await save({ amenities: selected }, 4, { goTo: 5 });
      }}
      className="space-y-8"
    >
      <p className="text-base text-stone-600">
        Marque tudo o que o imóvel oferece. Essas informações vão para os
        anúncios e para as descrições automáticas.
      </p>

      {AMENITY_CATEGORIES.map((cat) => (
        <fieldset key={cat.value}>
          <legend className="mb-3 text-lg font-bold text-stone-900">
            {cat.label}
          </legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {AMENITIES.filter((a) => a.category === cat.value).map((a) => (
              <CheckboxField
                key={a.key}
                label={a.label}
                checked={selected.includes(a.key)}
                onChange={() => toggle(a.key)}
              />
            ))}
          </div>
        </fieldset>
      ))}

      <WizardNav
        propertyId={property.id}
        step={4}
        saving={saving}
        savedAt={savedAt}
        onSaveDraft={async () => {
          const ok = await save({ amenities: selected }, 4);
          if (ok) toast("Rascunho salvo!");
        }}
      />
    </form>
  );
}
