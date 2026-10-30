"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Building2,
  CalendarDays,
  KeyRound,
  LogOut,
  MessageCircle,
  Settings,
} from "lucide-react";
import { ChatNaoLidasBadge } from "@/components/chat/nao-lidas-badge";
import { cn } from "@/lib/cn";

const links = [
  { href: "/painel", label: "Imóveis", icon: Building2 },
  { href: "/permutas-admin", label: "Permutas", icon: KeyRound },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/conversas", label: "Conversas", icon: MessageCircle },
  { href: "/atividade", label: "Atividade", icon: Activity },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function NavLinks({ showLogout = false }: { showLogout?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  async function sair() {
    await fetch("/api/sair", { method: "POST" }).catch(() => {});
    router.push("/entrar");
    router.refresh();
  }

  return (
    <nav className="flex items-center gap-1 sm:gap-2" aria-label="Principal">
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/painel"
            ? pathname === "/painel" || pathname.startsWith("/imoveis")
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-12 items-center gap-2 rounded-xl px-3 font-semibold transition-colors sm:px-4",
              active
                ? "bg-brand-800 text-white"
                : "text-brand-50 hover:bg-brand-800/60",
            )}
          >
            <Icon className="size-5 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
            {href === "/conversas" && <ChatNaoLidasBadge />}
          </Link>
        );
      })}
      {showLogout && (
        <button
          type="button"
          onClick={sair}
          title="Sair do painel neste aparelho"
          className="inline-flex min-h-12 items-center gap-2 rounded-xl px-3 font-semibold text-brand-200 transition-colors hover:bg-brand-800/60 hover:text-white sm:px-4"
        >
          <LogOut className="size-5 shrink-0" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      )}
    </nav>
  );
}
