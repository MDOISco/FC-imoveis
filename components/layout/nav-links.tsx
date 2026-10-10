"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, KeyRound, Settings } from "lucide-react";
import { cn } from "@/lib/cn";

const links = [
  { href: "/", label: "Imóveis", icon: Building2 },
  { href: "/permutas-admin", label: "Permutas", icon: KeyRound },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 sm:gap-2" aria-label="Principal">
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/"
            ? pathname === "/" || pathname.startsWith("/imoveis")
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
          </Link>
        );
      })}
    </nav>
  );
}
