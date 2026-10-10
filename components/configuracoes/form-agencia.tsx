"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import { maskPhone } from "@/lib/format";

export type AgencyData = {
  agencyName: string;
  creci: string;
  phone: string;
  whatsapp: string;
  email: string;
};

export function FormAgencia({ initial }: { initial: AgencyData }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof AgencyData>(k: K, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      className="max-w-xl space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
          await apiFetch("/api/configuracoes", {
            method: "PATCH",
            body: {
              agencyName: form.agencyName,
              creci: form.creci || null,
              phone: form.phone || null,
              whatsapp: form.whatsapp || null,
              email: form.email || null,
            },
          });
          toast("Dados da imobiliária salvos!");
        } catch (err) {
          toast(
            err instanceof ApiError ? err.message : "Não foi possível salvar.",
            "erro",
          );
        } finally {
          setSaving(false);
        }
      }}
    >
      <Field label="Nome da imobiliária" required htmlFor="agencyName">
        <Input
          id="agencyName"
          value={form.agencyName}
          onChange={(e) => set("agencyName", e.target.value)}
        />
      </Field>
      <Field label="CRECI da imobiliária" htmlFor="creci">
        <Input
          id="creci"
          value={form.creci}
          onChange={(e) => set("creci", e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Telefone" htmlFor="phone">
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => set("phone", maskPhone(e.target.value))}
          />
        </Field>
        <Field label="WhatsApp" htmlFor="whatsapp">
          <Input
            id="whatsapp"
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", maskPhone(e.target.value))}
          />
        </Field>
      </div>
      <Field label="E-mail" htmlFor="email">
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </Field>
      <Button type="submit" size="lg" disabled={saving}>
        {saving ? "Salvando…" : "Salvar dados"}
      </Button>
    </form>
  );
}
