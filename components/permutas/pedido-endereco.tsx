"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import { maskPhone } from "@/lib/format";

/** "Quero saber a localização exata" → formulário de contato (vira fila no dashboard). */
export function PedidoEndereco({
  propertyId,
  token,
  defaults,
}: {
  propertyId: string;
  token?: string;
  defaults?: { name?: string; email?: string; phone?: string };
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: defaults?.name ?? "",
    email: defaults?.email ?? "",
    phone: defaults?.phone ?? "",
  });

  if (sent) {
    return (
      <p className="rounded-xl bg-brand-100 px-4 py-3 text-base font-semibold text-brand-900">
        ✓ Recebido! Nossa equipe vai entrar em contato com a localização.
      </p>
    );
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <MapPin className="size-5" /> Quero saber a localização exata
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Pedir localização exata"
        >
          <form
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await apiFetch("/api/permutas/pedido-endereco", {
                  method: "POST",
                  body: { propertyId, token, ...form },
                });
                setSent(true);
                setOpen(false);
                toast("Recebido! Nossa equipe entrará em contato. 😊");
              } catch (err) {
                toast(
                  err instanceof ApiError
                    ? err.message
                    : "Não foi possível enviar.",
                  "erro",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <div>
              <h3 className="text-xl font-bold text-stone-900">
                Localização exata
              </h3>
              <p className="mt-1 text-base text-stone-600">
                Por segurança, o endereço completo é informado pela nossa
                equipe. Deixe seu contato que retornamos rapidinho:
              </p>
            </div>
            <Field label="Seu nome" required htmlFor="pe-name">
              <Input
                id="pe-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </Field>
            <Field label="Celular / WhatsApp" required htmlFor="pe-phone">
              <Input
                id="pe-phone"
                inputMode="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: maskPhone(e.target.value) }))
                }
              />
            </Field>
            <Field label="E-mail" required htmlFor="pe-email">
              <Input
                id="pe-email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </Field>
            <div className="flex gap-3 pt-1">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={busy}>
                {busy ? "Enviando…" : "Enviar"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
