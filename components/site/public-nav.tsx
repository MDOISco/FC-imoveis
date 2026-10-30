"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  Home,
  KeyRound,
  MapPin,
  Menu,
  MessageCircle,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/cn";

type Item = { href: string; label: string; icon: typeof Home; match: string };

// Só destinos PÚBLICOS entram aqui (nada do painel da equipe).
const ITEMS: Item[] = [
  { href: "/site", label: "Imóveis", icon: Building2, match: "/site" },
  { href: "/permutas", label: "Permutas", icon: KeyRound, match: "/permutas" },
  { href: "/agendar", label: "Agendar visita", icon: CalendarDays, match: "/agendar" },
  { href: "/cidade", label: "Conheça a cidade", icon: MapPin, match: "/cidade" },
];

function isActive(pathname: string, match: string): boolean {
  return pathname === match || pathname.startsWith(`${match}/`);
}

export function PublicNav({
  agencyName,
  whatsappHref,
}: {
  agencyName: string;
  whatsappHref: string | null;
}) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-gold-500 bg-brand-950 text-white shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/site"
          className="flex items-center gap-3"
          onClick={() => setAberto(false)}
        >
          <Logo />
          <span>
            <span className="block whitespace-nowrap font-display text-xl font-bold tracking-tight sm:text-2xl">
              {agencyName}
            </span>
            <span className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-gold-300 sm:block">
              Bragança Paulista · SP
            </span>
          </span>
        </Link>

        {/* Menu no computador */}
        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Navegação do site"
        >
          {ITEMS.map(({ href, label, icon: Icon, match }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, match) ? "page" : undefined}
              className={cn(
                "inline-flex min-h-12 items-center gap-2 rounded-xl px-3 font-semibold transition-colors",
                isActive(pathname, match)
                  ? "bg-brand-800 text-white"
                  : "text-brand-100 hover:bg-brand-800/60",
              )}
            >
              <Icon className="size-5 shrink-0" />
              {label}
            </Link>
          ))}
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold-400 px-4 text-base font-bold text-gold-950 transition-colors hover:bg-gold-300"
            >
              <MessageCircle className="size-5" /> WhatsApp
            </a>
          )}
        </nav>

        {/* Botão do menu no celular */}
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          className="inline-flex size-12 items-center justify-center rounded-xl border-2 border-white/30 text-white hover:border-gold-300 hover:text-gold-200 lg:hidden"
        >
          {aberto ? <X className="size-7" /> : <Menu className="size-7" />}
        </button>
      </div>

      {/* Menu aberto no celular */}
      {aberto && (
        <nav
          className="border-t border-white/10 bg-brand-950 px-4 pb-4 pt-2 lg:hidden"
          aria-label="Navegação do site"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {ITEMS.map(({ href, label, icon: Icon, match }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setAberto(false)}
                aria-current={isActive(pathname, match) ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-14 items-center gap-3 rounded-xl px-4 text-lg font-semibold transition-colors",
                  isActive(pathname, match)
                    ? "bg-brand-800 text-white"
                    : "text-brand-100 hover:bg-brand-800/60",
                )}
              >
                <Icon className="size-6 shrink-0" />
                {label}
              </Link>
            ))}
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setAberto(false)}
                className="mt-1 inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-gold-400 px-4 text-lg font-bold text-gold-950 hover:bg-gold-300"
              >
                <MessageCircle className="size-6" /> Falar no WhatsApp
              </a>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
