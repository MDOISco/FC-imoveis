import Link from "next/link";
import { Building2, CalendarDays, KeyRound, MapPin } from "lucide-react";

const LINKS = [
  { href: "/", label: "Imóveis", icon: Building2 },
  { href: "/permutas", label: "Permutas", icon: KeyRound },
  { href: "/agendar", label: "Agendar visita", icon: CalendarDays },
  { href: "/cidade", label: "Conheça a cidade", icon: MapPin },
];

export function PublicFooter({
  agencyName,
  creci,
  phone,
  whatsapp,
}: {
  agencyName: string;
  creci?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
}) {
  const contato =
    [creci && `CRECI ${creci}`, phone, whatsapp && `WhatsApp ${whatsapp}`]
      .filter(Boolean)
      .join(" · ") || "Bragança Paulista/SP";

  return (
    <footer
      id="contato"
      className="border-t-2 border-gold-500 bg-brand-950 py-10 text-brand-100"
    >
      <div className="mx-auto max-w-6xl space-y-5 px-4 text-center sm:px-6">
        <p className="font-display text-2xl font-bold text-white">
          {agencyName}
        </p>
        <nav
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
          aria-label="Links do site"
        >
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-1.5 text-base font-semibold text-brand-100 hover:text-white hover:underline"
            >
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </nav>
        <p className="text-lg">{contato}</p>
        <p className="text-sm text-brand-300">
          Por segurança, a localização exata dos imóveis é informada apenas pela
          nossa equipe.
        </p>
      </div>
    </footer>
  );
}
