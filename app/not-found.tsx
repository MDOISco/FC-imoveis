import Link from "next/link";

/** Página "não encontrado" global, em português e com saídas claras. */
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border-2 border-stone-200 bg-white p-8 text-center">
        <p className="text-5xl">🔍</p>
        <h1 className="mt-3 text-2xl font-extrabold text-stone-900">
          Página não encontrada
        </h1>
        <p className="mt-2 text-lg text-stone-600">
          O endereço pode estar errado ou o link que você recebeu não é mais
          válido. Confira se copiou o link completo.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/permutas"
            className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-brand-700 px-6 text-lg font-extrabold text-white hover:bg-brand-800"
          >
            Ir para a página de Permutas
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl px-6 text-base font-bold text-brand-800 hover:underline"
          >
            Painel da equipe
          </Link>
        </div>
      </div>
    </div>
  );
}
