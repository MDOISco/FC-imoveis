import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Toaster } from "@/components/ui/toast";
import { getSettings } from "@/lib/settings";

export const metadata = {
  title: "Permutas · FC Imóveis",
  description:
    "Troque seu imóvel em Bragança Paulista: cadastre o seu, veja opções de permuta e dê match com a chave dourada.",
};

export default async function PermutasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <header className="bg-brand-900 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/permutas"
            className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight sm:text-xl"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-gold-400 text-gold-950">
              <KeyRound className="size-6" />
            </span>
            <span>
              {settings.agencyName}
              <span className="block text-xs font-semibold text-gold-300 sm:text-sm">
                Permutas de imóveis
              </span>
            </span>
          </Link>
          <Link
            href="/permutas/cadastrar"
            className="inline-flex min-h-12 items-center rounded-xl bg-gold-400 px-4 text-base font-bold text-gold-950 hover:bg-gold-300 sm:px-5"
          >
            Quero permutar
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">
        {children}
      </main>
      <footer className="border-t border-stone-200 bg-white py-6">
        <div className="mx-auto max-w-5xl space-y-1 px-4 text-center text-base text-stone-500">
          <p className="font-bold text-stone-700">{settings.agencyName}</p>
          <p>
            {[
              settings.creci && `CRECI ${settings.creci}`,
              settings.phone,
              settings.whatsapp && `WhatsApp ${settings.whatsapp}`,
            ]
              .filter(Boolean)
              .join(" · ") || "Bragança Paulista/SP"}
          </p>
          <p className="text-sm">
            Por segurança, a localização exata dos imóveis é informada apenas
            pela nossa equipe.
          </p>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}
