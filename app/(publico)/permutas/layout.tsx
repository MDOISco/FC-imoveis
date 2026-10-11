import Link from "next/link";
import { KeyRound } from "lucide-react";
import { ChatWidget } from "@/components/chat/chat-widget";
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
      <header className="border-b-2 border-gold-500 bg-brand-950 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/permutas"
            className="flex items-center gap-2.5 tracking-tight"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-gold-400 text-gold-950">
              <KeyRound className="size-6" />
            </span>
            <span>
              <span className="font-display text-lg font-bold sm:text-xl">
                {settings.agencyName}
              </span>
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">
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
      <footer className="border-t-2 border-gold-500 bg-brand-950 py-8 text-brand-100">
        <div className="mx-auto max-w-5xl space-y-1.5 px-4 text-center text-base">
          <p className="font-display text-xl font-bold text-white">
            {settings.agencyName}
          </p>
          <p>
            {[
              settings.creci && `CRECI ${settings.creci}`,
              settings.phone,
              settings.whatsapp && `WhatsApp ${settings.whatsapp}`,
            ]
              .filter(Boolean)
              .join(" · ") || "Bragança Paulista/SP"}
          </p>
          <p className="text-sm text-brand-200">
            Por segurança, a localização exata dos imóveis é informada apenas
            pela nossa equipe.
          </p>
        </div>
      </footer>
      <ChatWidget />
      <Toaster />
    </div>
  );
}
