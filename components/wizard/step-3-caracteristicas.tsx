"use client";

import { useMemo, useState } from "react";
import { CheckboxField } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NumberStepper } from "@/components/ui/number-stepper";
import { RadioCards } from "@/components/ui/radio-cards";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import {
  APARTMENT_LIKE_TYPES,
  FURNISHED_OPTIONS,
  LAND_TYPES,
  SOLAR_POSITIONS,
} from "@/lib/constants";
import { parseAreaInput } from "@/lib/format";
import type { WizardProperty } from "@/lib/wizard-dto";
import { useDirtyGuard, useStepSave } from "./use-step-save";
import { WizardNav } from "./wizard-nav";

type Form = {
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parkingCovered: number | null;
  parkingUncovered: number | null;
  usableArea: string;
  totalArea: string;
  floor: number | null;
  totalFloors: number | null;
  yearBuilt: string;
  furnished: string;
  acceptsPets: boolean;
  solarPosition: string;
};

export function Step3Caracteristicas({
  property,
}: {
  property: WizardProperty;
  step?: number;
}) {
  const initial: Form = useMemo(
    () => ({
      bedrooms: property.bedrooms,
      suites: property.suites,
      bathrooms: property.bathrooms,
      parkingCovered: property.parkingCovered,
      parkingUncovered: property.parkingUncovered,
      usableArea: property.usableArea?.toString().replace(".", ",") ?? "",
      totalArea: property.totalArea?.toString().replace(".", ",") ?? "",
      floor: property.floor,
      totalFloors: property.totalFloors,
      yearBuilt: property.yearBuilt?.toString() ?? "",
      furnished: property.furnished ?? "",
      acceptsPets: property.acceptsPets,
      solarPosition: property.solarPosition ?? "",
    }),
    [property],
  );
  const [form, setForm] = useState<Form>(initial);
  const { save, saving, savedAt } = useStepSave(property.id);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useDirtyGuard(dirty && !saving);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isLand = LAND_TYPES.includes(property.propertyType ?? "");
  const isApartmentLike = APARTMENT_LIKE_TYPES.includes(
    property.propertyType ?? "",
  );

  function payload() {
    const year = form.yearBuilt ? Number(form.yearBuilt) : null;
    return {
      bedrooms: form.bedrooms,
      suites: form.suites,
      bathrooms: form.bathrooms,
      parkingCovered: form.parkingCovered,
      parkingUncovered: form.parkingUncovered,
      usableArea: parseAreaInput(form.usableArea),
      totalArea: parseAreaInput(form.totalArea),
      floor: isApartmentLike ? form.floor : null,
      totalFloors: isApartmentLike ? form.totalFloors : null,
      yearBuilt: Number.isFinite(year) && year ? year : null,
      furnished: form.furnished || null,
      acceptsPets: form.acceptsPets,
      solarPosition: form.solarPosition || null,
    };
  }

  const counters: Array<{
    key: "bedrooms" | "suites" | "bathrooms" | "parkingCovered" | "parkingUncovered";
    label: string;
    help?: string;
  }> = [
    { key: "bedrooms", label: "Quartos" },
    { key: "suites", label: "Sendo suítes" },
    { key: "bathrooms", label: "Banheiros" },
    { key: "parkingCovered", label: "Vagas cobertas" },
    { key: "parkingUncovered", label: "Vagas descobertas" },
  ];

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await save(payload(), 3, { goTo: 4 });
      }}
      className="space-y-7"
    >
      {!isLand && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {counters.map((c) => (
            <div
              key={c.key}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-stone-200 bg-white px-4 py-3"
            >
              <span className="font-semibold text-stone-800">{c.label}</span>
              <NumberStepper
                label={c.label}
                value={form[c.key]}
                onChange={(v) => set(c.key, v)}
              />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label={isLand ? "Área do terreno (m²)" : "Área útil / construída (m²)"}
          htmlFor="usableArea"
        >
          <Input
            id="usableArea"
            inputMode="decimal"
            placeholder="Ex.: 120"
            value={form.usableArea}
            onChange={(e) => set("usableArea", e.target.value)}
          />
        </Field>
        <Field label="Área total do lote (m²)" htmlFor="totalArea">
          <Input
            id="totalArea"
            inputMode="decimal"
            placeholder="Ex.: 300"
            value={form.totalArea}
            onChange={(e) => set("totalArea", e.target.value)}
          />
        </Field>
      </div>

      {isApartmentLike && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-stone-200 bg-white px-4 py-3">
            <span className="font-semibold text-stone-800">Andar</span>
            <NumberStepper
              label="Andar"
              value={form.floor}
              onChange={(v) => set("floor", v)}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-stone-200 bg-white px-4 py-3">
            <span className="font-semibold text-stone-800">
              Andares no prédio
            </span>
            <NumberStepper
              label="Andares no prédio"
              value={form.totalFloors}
              onChange={(v) => set("totalFloors", v)}
            />
          </div>
        </div>
      )}

      {!isLand && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Ano de construção" htmlFor="yearBuilt">
              <Input
                id="yearBuilt"
                inputMode="numeric"
                maxLength={4}
                placeholder="Ex.: 2015"
                value={form.yearBuilt}
                onChange={(e) =>
                  set("yearBuilt", e.target.value.replace(/\D/g, ""))
                }
              />
            </Field>
            <Field label="Posição do sol" htmlFor="solarPosition">
              <Select
                id="solarPosition"
                options={SOLAR_POSITIONS}
                placeholder="Não sei / não se aplica"
                value={form.solarPosition}
                onChange={(e) => set("solarPosition", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Mobília">
            <RadioCards
              name="furnished"
              options={FURNISHED_OPTIONS}
              value={form.furnished}
              onChange={(v) => set("furnished", v)}
              columns={3}
            />
          </Field>

          <CheckboxField
            label="Aceita animais de estimação"
            checked={form.acceptsPets}
            onChange={(e) => set("acceptsPets", e.target.checked)}
          />
        </>
      )}

      <WizardNav
        propertyId={property.id}
        step={3}
        saving={saving}
        savedAt={savedAt}
        onSaveDraft={async () => {
          const ok = await save(payload(), 3);
          if (ok) toast("Rascunho salvo!");
        }}
      />
    </form>
  );
}
