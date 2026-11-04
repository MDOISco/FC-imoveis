import { ChatWidget } from "@/components/chat/chat-widget";
import { PublicFooter } from "@/components/site/public-footer";
import { PublicNav } from "@/components/site/public-nav";
import { Toaster } from "@/components/ui/toast";
import { getSettings } from "@/lib/settings";
import { waHref } from "@/lib/whatsapp";

/**
 * Chrome compartilhado de TODAS as páginas públicas: menu de navegação único
 * (só acessos públicos), rodapé com os mesmos links, bate-papo e avisos.
 * Cada seção (site/permutas/agendar/cidade) cuida só do seu conteúdo.
 * Atenção: nada de "noindex" aqui — site/permutas/agendar/cidade estão no
 * ar e aparecem no Google (o que não deve aparecer está em app/robots.ts).
 */
export default async function PublicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const zap = waHref(
    settings.whatsapp,
    "Olá! Vim pelo site da FC Imóveis e gostaria de um atendimento.",
  );

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <PublicNav agencyName={settings.agencyName} whatsappHref={zap} />
      <main className="flex-1">{children}</main>
      <PublicFooter
        agencyName={settings.agencyName}
        tradeName={settings.tradeName}
        cnpj={settings.cnpj}
        responsibleBroker={settings.responsibleBroker}
        creci={settings.creci}
        phone={settings.phone}
        whatsapp={settings.whatsapp}
      />
      <ChatWidget />
      <Toaster />
    </div>
  );
}
