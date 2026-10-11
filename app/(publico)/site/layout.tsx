import Link from "next/link";
import { Home } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { waHref } from "@/lib/whatsapp";

export const metadata = {
  title: "FC Imóveis — Imobiliária em Bragança Paulista/SP",
  description:
    "Casas, apartamentos, chácaras e terrenos em Bragança Paulista e região. Atendimento direto com os corretores Cátia e Francisco.",
  // Preview: tirar o noindex quando o site público for oficializado.
  robots: { index: false, follow: false },
};

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const zap = waHref(
    settings.whatsapp,
    "Olá! Vim pelo site da FC Imóveis e gostaria de um atendimento.",
  );

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <header className="sticky top-0 z-40 border-b-2 border-gold-500 bg-brand-950 text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/site" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gold-400 text-gold-950">
              <Home className="size-6" />
            </span>
            <span>
              <span className="block whitespace-nowrap font-display text-xl font-bold tracking-tight sm:text-2xl">
                {settings.agencyName}
              </span>
              <span className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-gold-300 sm:block">
                Bragança Paulista · SP
              </span>
            </span>
          </Link>
          <nav
            className="flex items-center gap-1 sm:gap-2"
            aria-label="Principal"
          >
            <a
              href="#imoveis"
              className="hidden min-h-12 items-center rounded-xl px-3 font-semibold text-brand-100 transition-colors hover:bg-brand-800/60 sm:inline-flex"
            >
              Imóveis
            </a>
            <Link
              href="/permutas"
              className="hidden min-h-12 items-center rounded-xl px-3 font-semibold text-brand-100 transition-colors hover:bg-brand-800/60 sm:inline-flex"
            >
              Permutas
            </Link>
            <a
              href="#contato"
              className="hidden min-h-12 items-center rounded-xl px-3 font-semibold text-brand-100 transition-colors hover:bg-brand-800/60 md:inline-flex"
            >
              Contato
            </a>
            {zap && (
              <a
                href={zap}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center rounded-xl bg-gold-400 px-4 text-base font-bold text-gold-950 transition-colors hover:bg-gold-300 sm:px-5"
              >
                WhatsApp
              </a>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer
        id="contato"
        className="border-t-2 border-gold-500 bg-brand-950 py-10 text-brand-100"
      >
        <div className="mx-auto max-w-6xl space-y-2 px-4 text-center sm:px-6">
          <p className="font-display text-2xl font-bold text-white">
            {settings.agencyName}
          </p>
          <p className="text-lg">
            {[
              settings.creci && `CRECI ${settings.creci}`,
              settings.phone,
              settings.whatsapp && `WhatsApp ${settings.whatsapp}`,
            ]
              .filter(Boolean)
              .join(" · ") || "Bragança Paulista/SP"}
          </p>
          <p className="text-base text-brand-200">
            Bragança Paulista/SP ·{" "}
            <Link href="/permutas" className="underline hover:text-white">
              Permutas de imóveis
            </Link>
          </p>
          <p className="text-sm text-brand-300">
            Por segurança, a localização exata dos imóveis é informada apenas
            pela nossa equipe.
          </p>
        </div>
      </footer>
    </div>
  );
}
