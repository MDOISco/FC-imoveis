import Link from "next/link";
import { Home } from "lucide-react";
import { NavLinks } from "./nav-links";
import { Toaster } from "@/components/ui/toast";

/** Moldura do dashboard: cabeçalho com navegação grande e área de conteúdo. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="bg-brand-900 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-xl px-2 py-1 text-xl font-extrabold tracking-tight"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-gold-400 text-gold-950">
              <Home className="size-6" />
            </span>
            FC Imóveis
          </Link>
          <NavLinks />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      <Toaster />
    </div>
  );
}
