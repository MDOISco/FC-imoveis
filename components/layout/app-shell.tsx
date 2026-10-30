import Link from "next/link";
import { NavLinks } from "./nav-links";
import { Logo } from "@/components/ui/logo";
import { Toaster } from "@/components/ui/toast";
import { authEnabled } from "@/lib/auth";

/** Moldura do dashboard: cabeçalho com navegação grande e área de conteúdo. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-gold-500 bg-brand-950 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-2 py-1"
          >
            <Logo />
            <span className="whitespace-nowrap font-display text-2xl font-bold tracking-tight">
              FC Imóveis
            </span>
          </Link>
          <NavLinks showLogout={authEnabled()} />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      <Toaster />
    </div>
  );
}
