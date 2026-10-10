import { ApiKeyField } from "@/components/configuracoes/api-key-field";
import { Corretores } from "@/components/configuracoes/corretores";
import { FeedUrls } from "@/components/configuracoes/feed-urls";
import { FormAgencia } from "@/components/configuracoes/form-agencia";
import { MarcaDagua } from "@/components/configuracoes/marca-dagua";
import { CardSection } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import { getSettings, maskApiKey } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = { title: "Configurações" };

const TABS = [
  { value: "agencia", label: "Imobiliária" },
  { value: "marca", label: "Marca d'água" },
  { value: "ia", label: "Descrições por IA" },
  { value: "portais", label: "Portais (feeds)" },
  { value: "corretores", label: "Corretores" },
];

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const { aba } = await searchParams;
  const active = TABS.some((t) => t.value === aba) ? aba! : "agencia";

  const [settings, brokers] = await Promise.all([
    getSettings(),
    db.broker.findMany({
      orderBy: [{ active: "desc" }, { name: "asc" }],
      include: { _count: { select: { properties: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-stone-900">
          Configurações
        </h1>
        <p className="mt-1 text-base text-stone-500">
          Dados da imobiliária, marca d'água, inteligência artificial, portais
          e equipe.
        </p>
      </div>

      <Tabs
        items={TABS.map((t) => ({
          ...t,
          href: `/configuracoes?aba=${t.value}`,
        }))}
        active={active}
      />

      <CardSection>
        {active === "agencia" && (
          <FormAgencia
            initial={{
              agencyName: settings.agencyName,
              creci: settings.creci ?? "",
              phone: settings.phone ?? "",
              whatsapp: settings.whatsapp ?? "",
              email: settings.email ?? "",
            }}
          />
        )}
        {active === "marca" && (
          <MarcaDagua
            logoPath={settings.logoPath}
            initial={{
              watermarkDefault: settings.watermarkDefault,
              watermarkPosition: settings.watermarkPosition,
              watermarkOpacity: settings.watermarkOpacity,
            }}
          />
        )}
        {active === "ia" && (
          <ApiKeyField masked={maskApiKey(settings.anthropicApiKey)} />
        )}
        {active === "portais" && (
          <FeedUrls
            initialBaseUrl={settings.publicBaseUrl ?? ""}
            fallbackBaseUrl={process.env.APP_URL ?? "http://localhost:3000"}
          />
        )}
        {active === "corretores" && (
          <Corretores
            brokers={brokers.map((b) => ({
              id: b.id,
              name: b.name,
              phone: b.phone,
              creci: b.creci,
              email: b.email,
              active: b.active,
              propertiesCount: b._count.properties,
            }))}
          />
        )}
      </CardSection>
    </div>
  );
}
