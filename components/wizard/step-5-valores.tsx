"use client";

import { useMemo, useState } from "react";
import { Lock, Repeat } from "lucide-react";
import { CheckboxField } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "@/components/ui/toast";
import {
  DOCS_STATUS_OPTIONS,
  IPTU_PERIODS,
  purposeIncludesRent,
  purposeIncludesSale,
  purposeIsSeason,
} from "@/lib/constants";
import { maskPhone } from "@/lib/format";
import type { WizardProperty } from "@/lib/wizard-dto";
import { useDirtyGuard, useStepSave } from "./use-step-save";
import { WizardNav } from "./wizard-nav";

type Form = {
  salePrice: number | null;
  rentPrice: number | null;
  seasonDailyPrice: number | null;
  condoFee: number | null;
  iptuValue: number | null;
  iptuPeriod: string;
  acceptsFinancing: boolean;
  acceptsFgts: boolean;
  acceptsTrade: boolean;
  priceOnRequest: boolean;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  commissionPct: string;
  docsStatus: string;
  internalNotes: string;
};

export function Step5Valores({
  property,
}: {
  property: WizardProperty;
  step?: number;
}) {
  const initial: Form = useMemo(
    () => ({
      salePrice: property.salePrice,
      rentPrice: property.rentPrice,
      seasonDailyPrice: property.seasonDailyPrice,
      condoFee: property.condoFee,
      iptuValue: property.iptuValue,
      iptuPeriod: property.iptuPeriod || "ANUAL",
      acceptsFinancing: property.acceptsFinancing,
      acceptsFgts: property.acceptsFgts,
      acceptsTrade: property.acceptsTrade,
      priceOnRequest: property.priceOnRequest,
      ownerName: property.ownerName ?? "",
      ownerPhone: property.ownerPhone ?? "",
      ownerEmail: property.ownerEmail ?? "",
      commissionPct: property.commissionPct?.toString() ?? "",
      docsStatus: property.docsStatus ?? "",
      internalNotes: property.internalNotes ?? "",
    }),
    [property],
  );
  const [form, setForm] = useState<Form>(initial);
  const { save, saving, savedAt } = useStepSave(property.id);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useDirtyGuard(dirty && !saving);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const showSale = purposeIncludesSale(property.purpose);
  const showRent = purposeIncludesRent(property.purpose);
  const showSeason = purposeIsSeason(property.purpose);

  function payload() {
    const pct = form.commissionPct
      ? Number(form.commissionPct.replace(",", "."))
      : null;
    return {
      salePrice: form.salePrice,
      rentPrice: form.rentPrice,
      seasonDailyPrice: form.seasonDailyPrice,
      condoFee: form.condoFee,
      iptuValue: form.iptuValue,
      iptuPeriod: form.iptuPeriod,
      acceptsFinancing: form.acceptsFinancing,
      acceptsFgts: form.acceptsFgts,
      acceptsTrade: form.acceptsTrade,
      priceOnRequest: form.priceOnRequest,
      ownerName: form.ownerName,
      ownerPhone: form.ownerPhone,
      ownerEmail: form.ownerEmail,
      commissionPct: Number.isFinite(pct) && pct !== null ? pct : null,
      docsStatus: form.docsStatus || null,
      internalNotes: form.internalNotes,
    };
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await save(payload(), 5, { goTo: 6 });
      }}
      className="space-y-7"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {showSale && (
          <Field label="Preço de venda" htmlFor="salePrice">
            <MoneyInput
              id="salePrice"
              value={form.salePrice}
              onChange={(v) => set("salePrice", v)}
              disabled={form.priceOnRequest}
            />
          </Field>
        )}
        {showRent && (
          <Field label="Valor da locação (por mês)" htmlFor="rentPrice">
            <MoneyInput
              id="rentPrice"
              value={form.rentPrice}
              onChange={(v) => set("rentPrice", v)}
              disabled={form.priceOnRequest}
            />
          </Field>
        )}
        {showSeason && (
          <Field label="Valor da diária (temporada)" htmlFor="seasonDailyPrice">
            <MoneyInput
              id="seasonDailyPrice"
              value={form.seasonDailyPrice}
              onChange={(v) => set("seasonDailyPrice", v)}
              disabled={form.priceOnRequest}
            />
          </Field>
        )}
        <Field label="Condomínio (por mês)" htmlFor="condoFee">
          <MoneyInput
            id="condoFee"
            value={form.condoFee}
            onChange={(v) => set("condoFee", v)}
          />
        </Field>
        <Field label="IPTU" htmlFor="iptuValue">
          <div className="flex gap-2">
            <MoneyInput
              id="iptuValue"
              value={form.iptuValue}
              onChange={(v) => set("iptuValue", v)}
            />
            <Select
              aria-label="Período do IPTU"
              className="max-w-36"
              options={IPTU_PERIODS}
              value={form.iptuPeriod}
              onChange={(e) => set("iptuPeriod", e.target.value)}
            />
          </div>
        </Field>
      </div>

      <Toggle
        checked={form.priceOnRequest}
        onChange={(v) => set("priceOnRequest", v)}
        label="Preço sob consulta"
        help="O valor não aparece nos anúncios. Atenção: imóveis sob consulta não entram nos portais (eles exigem preço)."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {showSale && (
          <>
            <CheckboxField
              label="Aceita financiamento"
              checked={form.acceptsFinancing}
              onChange={(e) => set("acceptsFinancing", e.target.checked)}
            />
            <CheckboxField
              label="Aceita FGTS"
              checked={form.acceptsFgts}
              onChange={(e) => set("acceptsFgts", e.target.checked)}
            />
          </>
        )}
      </div>

      <div className="rounded-2xl border-2 border-gold-300 bg-gold-50 p-5">
        <Toggle
          checked={form.acceptsTrade}
          onChange={(v) => set("acceptsTrade", v)}
          label="♻️ Disponível para PERMUTA"
          help="O imóvel aparece na página de Permutas do site, onde clientes interessados em trocar de imóvel podem demonstrar interesse."
        />
        {form.acceptsTrade && (
          <p className="mt-3 flex items-start gap-2 text-base text-gold-900">
            <Repeat className="mt-0.5 size-5 shrink-0" />
            As curtidas de clientes aparecem em{" "}
            <strong>Permutas → Interesses</strong> no menu, para você aceitar em
            nome do proprietário.
          </p>
        )}
      </div>

      <details className="group rounded-2xl border-2 border-stone-200 bg-stone-50 open:bg-white">
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 font-bold text-stone-800">
          <Lock className="size-5 text-stone-500" />
          Dados internos (nunca aparecem nos anúncios)
          <span className="ml-auto text-sm font-semibold text-stone-400 group-open:hidden">
            clique para abrir
          </span>
        </summary>
        <div className="space-y-5 border-t-2 border-stone-100 p-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Nome do proprietário" htmlFor="ownerName">
              <Input
                id="ownerName"
                value={form.ownerName}
                onChange={(e) => set("ownerName", e.target.value)}
              />
            </Field>
            <Field label="Telefone do proprietário" htmlFor="ownerPhone">
              <Input
                id="ownerPhone"
                inputMode="tel"
                value={form.ownerPhone}
                onChange={(e) => set("ownerPhone", maskPhone(e.target.value))}
              />
            </Field>
            <Field label="E-mail do proprietário" htmlFor="ownerEmail">
              <Input
                id="ownerEmail"
                type="email"
                value={form.ownerEmail}
                onChange={(e) => set("ownerEmail", e.target.value)}
              />
            </Field>
            <Field label="Comissão (%)" htmlFor="commissionPct">
              <Input
                id="commissionPct"
                inputMode="decimal"
                className="max-w-32"
                value={form.commissionPct}
                onChange={(e) =>
                  set("commissionPct", e.target.value.replace(/[^\d,.]/g, ""))
                }
              />
            </Field>
          </div>
          <Field label="Situação da documentação" htmlFor="docsStatus">
            <Select
              id="docsStatus"
              options={DOCS_STATUS_OPTIONS}
              placeholder="Não informado"
              value={form.docsStatus}
              onChange={(e) => set("docsStatus", e.target.value)}
            />
          </Field>
          <Field label="Observações internas" htmlFor="internalNotes">
            <Textarea
              id="internalNotes"
              rows={3}
              value={form.internalNotes}
              onChange={(e) => set("internalNotes", e.target.value)}
              placeholder="Anotações da equipe (chaves, horários de visita, combinados…)"
            />
          </Field>
        </div>
      </details>

      <WizardNav
        propertyId={property.id}
        step={5}
        saving={saving}
        savedAt={savedAt}
        onSaveDraft={async () => {
          const ok = await save(payload(), 5);
          if (ok) toast("Rascunho salvo!");
        }}
      />
    </form>
  );
}
