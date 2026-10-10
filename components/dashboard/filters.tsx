import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  PURPOSES,
  SORT_OPTIONS,
} from "@/lib/constants";

/** Filtros via formulário GET — funcionam sem JavaScript e ficam na URL. */
export function Filters({
  busca,
  status,
  tipo,
  finalidade,
  ordem,
}: {
  busca: string;
  status: string;
  tipo: string;
  finalidade: string;
  ordem: string;
}) {
  const hasFilters = busca || status || tipo || finalidade || ordem;
  return (
    <form
      method="GET"
      action="/"
      className="grid grid-cols-1 items-end gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6"
    >
      <div className="lg:col-span-2">
        <label
          htmlFor="busca"
          className="mb-1.5 block text-sm font-semibold text-stone-600"
        >
          Buscar
        </label>
        <Input
          id="busca"
          name="busca"
          defaultValue={busca}
          placeholder="Código, título ou bairro…"
        />
      </div>
      <div>
        <label
          htmlFor="f-status"
          className="mb-1.5 block text-sm font-semibold text-stone-600"
        >
          Situação
        </label>
        <Select
          id="f-status"
          name="status"
          defaultValue={status}
          options={PROPERTY_STATUSES.filter(
            (s) => !["EM_APROVACAO", "REPROVADO"].includes(s.value),
          )}
          placeholder="Todas"
        />
      </div>
      <div>
        <label
          htmlFor="f-tipo"
          className="mb-1.5 block text-sm font-semibold text-stone-600"
        >
          Tipo
        </label>
        <Select
          id="f-tipo"
          name="tipo"
          defaultValue={tipo}
          options={PROPERTY_TYPES}
          placeholder="Todos"
        />
      </div>
      <div>
        <label
          htmlFor="f-finalidade"
          className="mb-1.5 block text-sm font-semibold text-stone-600"
        >
          Finalidade
        </label>
        <Select
          id="f-finalidade"
          name="finalidade"
          defaultValue={finalidade}
          options={PURPOSES}
          placeholder="Todas"
        />
      </div>
      <div>
        <label
          htmlFor="f-ordem"
          className="mb-1.5 block text-sm font-semibold text-stone-600"
        >
          Ordenar por
        </label>
        <Select
          id="f-ordem"
          name="ordem"
          defaultValue={ordem}
          options={SORT_OPTIONS}
        />
      </div>
      <div className="flex gap-2 lg:col-span-6">
        <Button type="submit" className="flex-1 sm:flex-none sm:px-10">
          <Search className="size-5" /> Filtrar
        </Button>
        {hasFilters && (
          <Link
            href="/"
            className="inline-flex min-h-12 items-center rounded-xl px-4 font-semibold text-stone-500 hover:text-stone-800"
          >
            Limpar filtros
          </Link>
        )}
      </div>
    </form>
  );
}
