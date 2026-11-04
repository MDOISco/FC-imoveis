import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ImprimirBotao } from "@/components/ficha/imprimir-botao";
import { Logo } from "@/components/ui/logo";
import { AMENITY_BY_KEY, PROPERTY_TYPE_LABELS, PURPOSE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatArea, formatBRL } from "@/lib/format";
import {
  priceLabel,
  publicLocation,
  publicTitle,
  totalParking,
} from "@/lib/property-display";
import { getSettings, publicBaseUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

/**
 * Ficha do imóvel para IMPRIMIR ou salvar em PDF e entregar ao cliente.
 * Fica em /imoveis/... (só a equipe entra, pelo middleware), mas o conteúdo
 * segue as regras do PÚBLICO: nada de rua/número/CEP, dono ou comissão —
 * o papel vai parar na mão do cliente.
 */
export default async function ImprimirFichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [property, settings] = await Promise.all([
    db.property.findUnique({
      where: { id },
      include: { photos: { orderBy: { position: "asc" } }, broker: true },
    }),
    getSettings(),
  ]);
  if (!property || property.source === "LEAD") notFound();

  const capa =
    property.photos.find((f) => f.isCover) ?? property.photos[0] ?? null;
  const outras = property.photos.filter((f) => f !== capa).slice(0, 6);
  let amenities: string[] = [];
  try {
    const lidas = JSON.parse(property.amenities);
    if (Array.isArray(lidas)) amenities = lidas.map(String);
  } catch {
    // sem comodidades legíveis
  }
  const vagas = totalParking(property);
  const site = publicBaseUrl(settings).replace(/^https?:\/\//, "");
  const contato = [
    settings.phone && `Tel. ${settings.phone}`,
    settings.whatsapp && `WhatsApp ${settings.whatsapp}`,
    settings.email,
  ]
    .filter(Boolean)
    .join(" · ");

  const specs: { rotulo: string; valor: string }[] = [];
  if (property.propertyType)
    specs.push({
      rotulo: "Tipo",
      valor: PROPERTY_TYPE_LABELS[property.propertyType],
    });
  if (property.purpose)
    specs.push({ rotulo: "Finalidade", valor: PURPOSE_LABELS[property.purpose] });
  if (property.bedrooms)
    specs.push({ rotulo: "Quartos", valor: String(property.bedrooms) });
  if (property.suites)
    specs.push({ rotulo: "Suítes", valor: String(property.suites) });
  if (property.bathrooms)
    specs.push({ rotulo: "Banheiros", valor: String(property.bathrooms) });
  if (vagas > 0) specs.push({ rotulo: "Vagas", valor: String(vagas) });
  if (property.usableArea)
    specs.push({ rotulo: "Área útil", valor: formatArea(property.usableArea) });
  if (property.totalArea)
    specs.push({ rotulo: "Área total", valor: formatArea(property.totalArea) });

  const valores: { rotulo: string; valor: string }[] = [];
  if (property.priceOnRequest) {
    valores.push({ rotulo: "Preço", valor: "Sob consulta" });
  } else {
    if (property.salePrice)
      valores.push({ rotulo: "Venda", valor: formatBRL(property.salePrice) });
    if (property.rentPrice)
      valores.push({
        rotulo: "Locação",
        valor: `${formatBRL(property.rentPrice)}/mês`,
      });
    if (property.seasonDailyPrice)
      valores.push({
        rotulo: "Diária",
        valor: formatBRL(property.seasonDailyPrice),
      });
  }
  if (property.condoFee)
    valores.push({
      rotulo: "Condomínio",
      valor: `${formatBRL(property.condoFee)}/mês`,
    });
  if (property.iptuValue)
    valores.push({
      rotulo: "IPTU",
      valor: `${formatBRL(property.iptuValue)}${property.iptuPeriod === "MENSAL" ? "/mês" : "/ano"}`,
    });

  return (
    <div className="min-h-screen bg-stone-100 py-6 print:bg-white print:py-0">
      <div className="mx-auto max-w-[820px] space-y-4 px-4 print:max-w-none print:space-y-0 print:px-0">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href={`/imoveis/${property.id}`}
            className="inline-flex items-center gap-1.5 text-base font-semibold text-stone-500 hover:text-brand-800"
          >
            <ArrowLeft className="size-5" /> Voltar à ficha
          </Link>
          <ImprimirBotao />
        </div>

        {/* A folha */}
        <div className="rounded-2xl bg-white p-8 shadow-sm print:rounded-none print:p-0 print:shadow-none">
          {/* Cabeçalho */}
          <header className="flex items-center justify-between gap-4 border-b-2 border-stone-200 pb-4">
            <div className="flex items-center gap-3">
              <Logo className="h-16" />
              <div>
                <p className="font-display text-2xl font-bold text-brand-900">
                  {settings.agencyName}
                </p>
                {settings.creci && (
                  <p className="text-sm text-stone-500">
                    CRECI {settings.creci}
                  </p>
                )}
              </div>
            </div>
            <p className="text-right text-base font-bold uppercase tracking-[0.12em] text-gold-700">
              {property.refCode}
            </p>
          </header>

          {/* Título e preço */}
          <section className="mt-5">
            <h1 className="font-display text-3xl font-bold text-stone-900">
              {publicTitle(property)}
            </h1>
            <p className="mt-1 text-lg text-stone-600">
              {publicLocation(property)}
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-brand-900">
              {priceLabel(property)}
            </p>
          </section>

          {/* Fotos */}
          {capa && (
            <section className="mt-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/arquivos/${capa.webPath}?v=${capa.updatedAt.getTime()}`}
                alt="Foto principal do imóvel"
                className="aspect-[16/10] w-full rounded-xl object-cover print:rounded-none"
              />
              {outras.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {outras.map((f) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={f.id}
                      src={`/api/arquivos/${f.webPath}?v=${f.updatedAt.getTime()}`}
                      alt=""
                      className="aspect-[4/3] w-full rounded-lg object-cover print:rounded-none"
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Características */}
          {specs.length > 0 && (
            <section className="mt-6 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
              {specs.map((s) => (
                <div key={s.rotulo} className="border-b border-stone-100 py-2">
                  <p className="text-sm font-semibold text-stone-500">
                    {s.rotulo}
                  </p>
                  <p className="text-lg font-bold text-stone-900">{s.valor}</p>
                </div>
              ))}
            </section>
          )}

          {/* Descrição */}
          {property.description && (
            <section className="mt-6">
              <h2 className="text-xl font-bold text-stone-900">Sobre o imóvel</h2>
              <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-stone-700">
                {property.description}
              </p>
            </section>
          )}

          {/* Comodidades */}
          {amenities.length > 0 && (
            <section className="mt-6">
              <h2 className="text-xl font-bold text-stone-900">Comodidades</h2>
              <p className="mt-2 text-base leading-relaxed text-stone-700">
                {amenities
                  .map((key) => AMENITY_BY_KEY[key]?.label ?? key)
                  .join(" · ")}
              </p>
            </section>
          )}

          {/* Valores */}
          {valores.length > 0 && (
            <section className="mt-6">
              <h2 className="text-xl font-bold text-stone-900">Valores</h2>
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
                {valores.map((v) => (
                  <div key={v.rotulo} className="border-b border-stone-100 py-2">
                    <p className="text-sm font-semibold text-stone-500">
                      {v.rotulo}
                    </p>
                    <p className="text-lg font-bold text-stone-900">{v.valor}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Rodapé de contato */}
          <footer className="mt-8 rounded-xl bg-brand-950 p-5 text-white print:rounded-none">
            <p className="font-display text-xl font-bold">
              Gostou? Fale com a gente!
            </p>
            {property.broker?.name && (
              <p className="mt-1 text-base">
                Corretor(a): <strong>{property.broker.name}</strong>
                {property.broker.phone && ` · ${property.broker.phone}`}
              </p>
            )}
            {contato && <p className="mt-1 text-base">{contato}</p>}
            <p className="mt-1 text-base text-brand-100">
              {site} · Ref. {property.refCode}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
