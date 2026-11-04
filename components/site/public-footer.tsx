import Link from "next/link";
import { Building2, CalendarDays, KeyRound, MapPin } from "lucide-react";

const LINKS = [
  { href: "/", label: "Imóveis", icon: Building2 },
  { href: "/permutas", label: "Permutas", icon: KeyRound },
  { href: "/agendar", label: "Agendar visita", icon: CalendarDays },
  { href: "/cidade", label: "Conheça a cidade", icon: MapPin },
];

export type DadosEmpresa = {
  tradeName?: string | null;
  cnpj?: string | null;
  responsibleBroker?: string | null;
  creci?: string | null;
};

/**
 * Dados oficiais da empresa (nome de fantasia, CNPJ e CRECI do corretor
 * responsável), vindos de Configurações → Imobiliária. Usado no rodapé do
 * site e no do link exclusivo.
 */
export function DadosLegais({
  tradeName,
  cnpj,
  responsibleBroker,
  creci,
}: DadosEmpresa) {
  const empresa = [tradeName, cnpj && `CNPJ ${cnpj}`]
    .filter(Boolean)
    .join(" · ");
  const responsavel = [
    responsibleBroker && `Corretor responsável: ${responsibleBroker}`,
    creci && `CRECI ${creci}`,
  ]
    .filter(Boolean)
    .join(" · ");
  if (!empresa && !responsavel) return null;
  return (
    <div className="space-y-1 text-base text-brand-100">
      {empresa && <p>{empresa}</p>}
      {responsavel && <p>{responsavel}</p>}
    </div>
  );
}

export function PublicFooter({
  agencyName,
  phone,
  whatsapp,
  ...dados
}: DadosEmpresa & {
  agencyName: string;
  phone?: string | null;
  whatsapp?: string | null;
}) {
  const contato =
    [phone, whatsapp && `WhatsApp ${whatsapp}`].filter(Boolean).join(" · ") ||
    "Bragança Paulista/SP";

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
        <DadosLegais {...dados} />
        <p className="text-sm text-brand-300">
          Por segurança, a localização exata dos imóveis é informada apenas pela
          nossa equipe.
        </p>
      </div>
    </footer>
  );
}
