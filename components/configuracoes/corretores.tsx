"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import { maskPhone } from "@/lib/format";

export type BrokerRow = {
  id: string;
  name: string;
  phone: string | null;
  creci: string | null;
  email: string | null;
  active: boolean;
  propertiesCount: number;
};

const emptyForm = { name: "", phone: "", creci: "", email: "" };

export function Corretores({ brokers }: { brokers: BrokerRow[] }) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (editingId) {
        await apiFetch(`/api/corretores/${editingId}`, {
          method: "PATCH",
          body: form,
        });
        toast("Corretor atualizado!");
      } else {
        await apiFetch("/api/corretores", { method: "POST", body: form });
        toast("Corretor cadastrado!");
      }
      setForm(emptyForm);
      setEditingId(null);
      router.refresh();
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Não foi possível salvar.",
        "erro",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <form
        onSubmit={submit}
        className="rounded-2xl border-2 border-stone-200 bg-white p-5"
      >
        <h3 className="mb-4 text-lg font-bold text-stone-900">
          {editingId ? "Editar corretor" : "Novo corretor"}
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome" required htmlFor="b-name">
            <Input
              id="b-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Telefone / WhatsApp" htmlFor="b-phone">
            <Input
              id="b-phone"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: maskPhone(e.target.value) }))
              }
            />
          </Field>
          <Field label="CRECI" htmlFor="b-creci">
            <Input
              id="b-creci"
              value={form.creci}
              onChange={(e) =>
                setForm((f) => ({ ...f, creci: e.target.value }))
              }
            />
          </Field>
          <Field label="E-mail" htmlFor="b-email">
            <Input
              id="b-email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </Field>
        </div>
        <div className="mt-5 flex gap-3">
          <Button type="submit" disabled={busy}>
            {editingId ? (
              "Salvar alterações"
            ) : (
              <>
                <Plus className="size-5" /> Cadastrar corretor
              </>
            )}
          </Button>
          {editingId && (
            <Button
              variant="secondary"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {brokers.map((b) => (
          <div
            key={b.id}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 bg-white px-5 py-4 ${
              b.active ? "border-stone-200" : "border-stone-100 opacity-60"
            }`}
          >
            <div>
              <p className="text-lg font-bold text-stone-900">
                {b.name}
                {!b.active && (
                  <span className="ml-2 text-sm font-semibold text-stone-400">
                    (desativado)
                  </span>
                )}
              </p>
              <p className="text-base text-stone-500">
                {[b.creci && `CRECI ${b.creci}`, b.phone, b.email]
                  .filter(Boolean)
                  .join(" · ") || "Sem contatos cadastrados"}
                {" · "}
                {b.propertiesCount} imóvel(is)
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingId(b.id);
                  setForm({
                    name: b.name,
                    phone: b.phone ?? "",
                    creci: b.creci ?? "",
                    email: b.email ?? "",
                  });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <UserPen className="size-5" /> Editar
              </Button>
              {b.active ? (
                <ConfirmButton
                  title={`Remover ${b.name}?`}
                  message={
                    b.propertiesCount > 0
                      ? "Este corretor tem imóveis vinculados, então ele será apenas desativado (o histórico fica guardado)."
                      : "O corretor será excluído."
                  }
                  confirmLabel="Sim, remover"
                  onConfirm={async () => {
                    try {
                      const res = await apiFetch<{ message?: string }>(
                        `/api/corretores/${b.id}`,
                        { method: "DELETE" },
                      );
                      toast(res.message ?? "Corretor removido.");
                      router.refresh();
                    } catch (err) {
                      toast(
                        err instanceof ApiError
                          ? err.message
                          : "Não foi possível remover.",
                        "erro",
                      );
                    }
                  }}
                >
                  Remover
                </ConfirmButton>
              ) : (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await apiFetch(`/api/corretores/${b.id}`, {
                      method: "PATCH",
                      body: { active: true },
                    });
                    toast("Corretor reativado!");
                    router.refresh();
                  }}
                >
                  Reativar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
