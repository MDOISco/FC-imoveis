"use client";

import { useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioCards } from "@/components/ui/radio-cards";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { ADDRESS_VISIBILITY_OPTIONS } from "@/lib/constants";
import { maskCep } from "@/lib/format";
import { useViaCep } from "@/lib/hooks/use-viacep";
import type { WizardProperty } from "@/lib/wizard-dto";
import { useDirtyGuard, useStepSave } from "./use-step-save";
import { WizardNav } from "./wizard-nav";

type Form = {
  cep: string;
  street: string;
  streetNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  condoName: string;
  addressVisibility: string;
};

export function Step2Endereco({ property }: { property: WizardProperty; step?: number }) {
  const initial: Form = useMemo(
    () => ({
      cep: property.cep ?? "",
      street: property.street ?? "",
      streetNumber: property.streetNumber ?? "",
      complement: property.complement ?? "",
      neighborhood: property.neighborhood ?? "",
      city: property.city || "Bragança Paulista",
      state: property.state || "SP",
      condoName: property.condoName ?? "",
      addressVisibility: property.addressVisibility || "BAIRRO",
    }),
    [property],
  );
  const [form, setForm] = useState<Form>(initial);
  const { save, saving, savedAt } = useStepSave(property.id);
  const viaCep = useViaCep();
  const numberRef = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useDirtyGuard(dirty && !saving);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleCepBlurOrComplete(cep: string) {
    const result = await viaCep.lookup(cep);
    if (result) {
      setForm((f) => ({
        ...f,
        street: result.street || f.street,
        neighborhood: result.neighborhood || f.neighborhood,
        city: result.city || f.city,
        state: result.state || f.state,
      }));
      numberRef.current?.focus();
    }
  }

  function payload() {
    return { ...form };
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await save(payload(), 2, { goTo: 3 });
      }}
      className="space-y-7"
    >
      <Field
        label="CEP"
        help="Digite o CEP e o endereço será preenchido automaticamente."
        htmlFor="cep"
        error={viaCep.error ?? undefined}
      >
        <div className="flex items-center gap-3">
          <Input
            id="cep"
            inputMode="numeric"
            className="max-w-48"
            value={form.cep}
            placeholder="00000-000"
            onChange={(e) => {
              const masked = maskCep(e.target.value);
              set("cep", masked);
              viaCep.clearError();
              if (masked.length === 9) void handleCepBlurOrComplete(masked);
            }}
          />
          {viaCep.loading && <Spinner />}
        </div>
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field label="Rua / Avenida" htmlFor="street" className="sm:col-span-2">
          <Input
            id="street"
            value={form.street}
            onChange={(e) => set("street", e.target.value)}
          />
        </Field>
        <Field label="Número" htmlFor="streetNumber">
          <Input
            id="streetNumber"
            ref={numberRef}
            value={form.streetNumber}
            onChange={(e) => set("streetNumber", e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Complemento" htmlFor="complement">
          <Input
            id="complement"
            value={form.complement}
            placeholder="Apto, bloco, fundos…"
            onChange={(e) => set("complement", e.target.value)}
          />
        </Field>
        <Field label="Bairro" htmlFor="neighborhood">
          <Input
            id="neighborhood"
            value={form.neighborhood}
            onChange={(e) => set("neighborhood", e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field label="Cidade" htmlFor="city" className="sm:col-span-2">
          <Input
            id="city"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
          />
        </Field>
        <Field label="Estado (UF)" htmlFor="state">
          <Input
            id="state"
            value={form.state}
            maxLength={2}
            onChange={(e) => set("state", e.target.value.toUpperCase())}
          />
        </Field>
      </div>

      <Field
        label="Nome do condomínio / empreendimento"
        help="Se o imóvel fica em condomínio."
        htmlFor="condoName"
      >
        <Input
          id="condoName"
          value={form.condoName}
          onChange={(e) => set("condoName", e.target.value)}
        />
      </Field>

      <Field
        label="O que mostrar do endereço nos anúncios?"
        help="Padrão da FC Imóveis: o público vê apenas cidade e bairro. O endereço completo fica guardado aqui no sistema. Quem quiser a localização exata deixa o contato e a equipe retorna."
      >
        <RadioCards
          name="addressVisibility"
          options={ADDRESS_VISIBILITY_OPTIONS}
          value={form.addressVisibility}
          onChange={(v) => set("addressVisibility", v)}
          columns={1}
        />
      </Field>

      <p className="flex items-start gap-2 rounded-xl bg-brand-50 p-4 text-base text-brand-900">
        <MapPin className="mt-0.5 size-5 shrink-0" />
        O endereço exato nunca aparece no site nem nos portais — isso evita
        negociações por fora e protege a comissão.
      </p>

      <WizardNav
        propertyId={property.id}
        step={2}
        saving={saving}
        savedAt={savedAt}
        onSaveDraft={async () => {
          const ok = await save(payload(), 2);
          if (ok) toast("Rascunho salvo!");
        }}
      />
    </form>
  );
}
