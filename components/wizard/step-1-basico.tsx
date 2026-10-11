"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioCards } from "@/components/ui/radio-cards";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import { PROPERTY_TYPES, PURPOSES, type Option } from "@/lib/constants";
import { suggestTitle } from "@/lib/title-suggestion";
import type { WizardProperty } from "@/lib/wizard-dto";
import { useDirtyGuard, useStepSave } from "./use-step-save";
import { WizardNav } from "./wizard-nav";

type Form = {
  purpose: string;
  propertyType: string;
  title: string;
  brokerId: string;
  capturedAt: string;
  exclusive: boolean;
};

export function Step1Basico({
  property,
  brokers,
  mode,
}: {
  property: WizardProperty | null;
  brokers: Option[];
  mode: "create" | "edit";
  step?: number;
}) {
  const router = useRouter();
  const initial: Form = useMemo(
    () => ({
      // Na UI, "PERMUTA" = Venda + tag de permuta (o banco guarda VENDA).
      purpose:
        property?.acceptsTrade && property?.purpose === "VENDA"
          ? "PERMUTA"
          : (property?.purpose ?? ""),
      propertyType: property?.propertyType ?? "",
      title: property?.title ?? "",
      brokerId: property?.brokerId ?? "",
      capturedAt:
        property?.capturedAt ?? new Date().toISOString().slice(0, 10),
      exclusive: property?.exclusive ?? false,
    }),
    [property],
  );
  const [form, setForm] = useState<Form>(initial);
  const [errors, setErrors] = useState<{ purpose?: string; propertyType?: string }>({});
  const [creating, setCreating] = useState(false);
  const stepSave = useStepSave(property?.id ?? "");
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useDirtyGuard(dirty && !creating && !stepSave.saving);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.purpose) errs.purpose = "Escolha a finalidade do anúncio";
    if (!form.propertyType) errs.propertyType = "Escolha o tipo de imóvel";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function payload() {
    // "PERMUTA" (UI) vira VENDA + tag de permuta no banco; se o corretor
    // tirou a opção Permuta, a tag é desligada junto.
    const isPermuta = form.purpose === "PERMUTA";
    const eraPermuta = initial.purpose === "PERMUTA";
    return {
      purpose: isPermuta ? "VENDA" : form.purpose,
      ...(isPermuta
        ? { acceptsTrade: true }
        : eraPermuta
          ? { acceptsTrade: false }
          : {}),
      propertyType: form.propertyType,
      title: form.title,
      brokerId: form.brokerId,
      capturedAt: form.capturedAt,
      exclusive: form.exclusive,
    };
  }

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (mode === "create") {
      setCreating(true);
      try {
        const res = await apiFetch<{ id: string }>("/api/imoveis", {
          method: "POST",
          body: payload(),
        });
        toast("Imóvel criado! Agora o endereço.");
        router.push(`/imoveis/${res.id}/editar?etapa=2`);
      } catch (err) {
        toast(
          err instanceof ApiError ? err.message : "Não foi possível criar.",
          "erro",
        );
        setCreating(false);
      }
    } else if (property) {
      await stepSave.save(payload(), 1, { goTo: 2 });
    }
  }

  async function handleSaveDraft() {
    if (!validate()) return;
    if (mode === "create") {
      setCreating(true);
      try {
        const res = await apiFetch<{ id: string }>("/api/imoveis", {
          method: "POST",
          body: payload(),
        });
        toast("Rascunho salvo! Você pode continuar depois.");
        router.push(`/imoveis/${res.id}/editar?etapa=2`);
      } catch (err) {
        toast(
          err instanceof ApiError ? err.message : "Não foi possível salvar.",
          "erro",
        );
        setCreating(false);
      }
    } else if (property) {
      const ok = await stepSave.save(payload(), 1);
      if (ok) toast("Rascunho salvo!");
    }
  }

  const suggestion = suggestTitle({
    propertyType: form.propertyType || null,
    purpose: form.purpose === "PERMUTA" ? "VENDA" : form.purpose || null,
    neighborhood: property?.neighborhood ?? null,
    condoName: property?.condoName ?? null,
    bedrooms: property?.bedrooms ?? null,
    city: property?.city ?? null,
  });

  return (
    <form onSubmit={handleContinue} className="space-y-7">
      <Field label="O que vai ser feito com este imóvel?" required error={errors.purpose}>
        <RadioCards
          name="purpose"
          options={PURPOSES}
          value={form.purpose}
          onChange={(v) => set("purpose", v)}
          columns={2}
        />
      </Field>

      <Field label="Tipo de imóvel" required error={errors.propertyType} htmlFor="propertyType">
        <Select
          id="propertyType"
          options={PROPERTY_TYPES}
          placeholder="Escolha o tipo…"
          value={form.propertyType}
          onChange={(e) => set("propertyType", e.target.value)}
          aria-invalid={!!errors.propertyType}
        />
      </Field>

      <Field
        label="Título do anúncio"
        help="Pode deixar em branco e usar a sugestão automática."
        htmlFor="title"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="title"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={120}
            placeholder="Ex.: Casa com 3 quartos no Centro"
          />
          <Button
            variant="secondary"
            className="shrink-0"
            disabled={!form.propertyType}
            onClick={() => set("title", suggestion)}
          >
            <Wand2 className="size-5" /> Sugerir título
          </Button>
        </div>
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Corretor responsável" htmlFor="brokerId">
          <Select
            id="brokerId"
            options={brokers}
            placeholder="Escolha o corretor…"
            value={form.brokerId}
            onChange={(e) => set("brokerId", e.target.value)}
          />
        </Field>
        <Field label="Data de captação" htmlFor="capturedAt">
          <Input
            id="capturedAt"
            type="date"
            value={form.capturedAt}
            onChange={(e) => set("capturedAt", e.target.value)}
          />
        </Field>
      </div>

      <CheckboxField
        label="Imóvel com exclusividade"
        help="A FC Imóveis é a única imobiliária autorizada a vender/alugar."
        checked={form.exclusive}
        onChange={(e) => set("exclusive", e.target.checked)}
      />

      {mode === "create" ? (
        <div className="mt-8 flex flex-col gap-3 border-t-2 border-stone-100 pt-6 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="lg" disabled={creating} onClick={handleSaveDraft}>
            Salvar rascunho
          </Button>
          <Button type="submit" size="lg" disabled={creating}>
            {creating ? <Spinner className="border-white/40 border-t-white" /> : "Continuar →"}
          </Button>
        </div>
      ) : (
        <WizardNav
          propertyId={property!.id}
          step={1}
          saving={stepSave.saving}
          savedAt={stepSave.savedAt}
          onSaveDraft={handleSaveDraft}
        />
      )}
    </form>
  );
}
