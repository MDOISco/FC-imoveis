import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { ArrowLeft, Lock, Repeat } from "lucide-react";
import { Galeria } from "@/components/ficha/galeria";
import {
  LinksPrivados,
  type LinkPrivadoDto,
} from "@/components/ficha/links-privados";
import { LocalizacaoImovel } from "@/components/ficha/localizacao-imovel";
import { PortalToggles } from "@/components/ficha/portal-toggles";
import { SitePublicacao } from "@/components/ficha/site-publicacao";
import { StatusActions } from "@/components/ficha/status-actions";
import { Badge } from "@/components/ui/badge";
import { CardSection } from "@/components/ui/card";
import {
  ADDRESS_VISIBILITY_OPTIONS,
  AMENITY_BY_KEY,
  DOCS_STATUS_OPTIONS,
  FURNISHED_OPTIONS,
  labelOf,
  PROPERTY_TYPE_LABELS,
  PURPOSE_LABELS,
  SOLAR_POSITIONS,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
} from "@/lib/constants";
import { db } from "@/lib/db";
import { linkToDto } from "@/lib/exclusivo";
import { formatArea, formatBRL, formatDate } from "@/lib/format";
import { atualizarLocalizacao, chaveEndereco } from "@/lib/geo/imovel";
import { displayTitle, priceLabel } from "@/lib/property-display";
import { getSettings, publicBaseUrl } from "@/lib/settings";
import { toWizardProperty } from "@/lib/wizard-dto";

export const dynamic = "force-dynamic";

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex justify-between gap-4 border-b border-stone-100 py-2.5 last:border-0">
      <dt className="shrink-0 font-semibold text-stone-500">{label}</dt>
      <dd className="text-right font-medium text-stone-900">{value}</dd>
    </div>
  );
}

export default async function FichaImovelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [property, settings] = await Promise.all([
    db.property.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { position: "asc" } },
        video: true,
        publications: true,
        broker: true,
        lead: true,
        privateLinks: { orderBy: { createdAt: "desc" } },
      },
    }),
    getSettings(),
  ]);
  if (!property) notFound();

  const dto = toWizardProperty(property);
  const base = publicBaseUrl(settings);
  const linksDto: LinkPrivadoDto[] = property.privateLinks.map((l) =>
    linkToDto(l, base),
  );
  const parking =
    (property.parkingCovered ?? 0) + (property.parkingUncovered ?? 0);
  const amenities = dto.amenities;

  // Imóvel antigo, nunca procurado no mapa: localiza ao abrir a ficha
  // (depois de responder; a equipe recarrega para ver).
  const temEndereco = chaveEndereco(property) !== "";
  if (property.source !== "LEAD" && !property.geocodedAt && temEndereco) {
    after(() => atualizarLocalizacao(property.id).then(() => undefined));
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/painel"
          className="inline-flex items-center gap-1.5 text-base font-semibold text-stone-500 hover:text-brand-800"
        >
          <ArrowLeft className="size-5" /> Voltar ao painel
        </Link>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={STATUS_BADGE_CLASSES[property.status]}>
                {STATUS_LABELS[property.status]}
              </Badge>
              {property.acceptsTrade && (
                <Badge className="bg-gold-100 text-gold-900">
                  <Repeat className="size-4" /> Permuta
                </Badge>
              )}
              <span className="text-base font-bold uppercase tracking-[0.12em] text-gold-700">
                {property.refCode}
              </span>
            </div>
            <h1 className="mt-1.5 font-display text-4xl font-bold text-stone-900">
              {displayTitle(property)}
            </h1>
            <p className="mt-1 text-lg text-stone-500">
              {[property.neighborhood, property.city]
                .filter(Boolean)
                .join(", ")}
              {" · "}
              <span className="font-bold text-brand-800">
                {priceLabel(property)}
              </span>
            </p>
          </div>
          {property.source === "LEAD" ? (
            <Link
              href="/permutas-admin?aba=clientes"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold-100 px-4 font-bold text-gold-950 hover:bg-gold-200"
            >
              👤 Imóvel de cliente — gerenciar em Permutas
            </Link>
          ) : (
            <StatusActions propertyId={property.id} status={property.status} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Galeria
            photos={dto.photos}
            video={dto.video}
            title={displayTitle(property)}
          />

          {property.description && (
            <CardSection title="Descrição do anúncio">
              <p className="whitespace-pre-line text-base leading-relaxed text-stone-700">
                {property.description}
              </p>
            </CardSection>
          )}

          {amenities.length > 0 && (
            <CardSection title="Comodidades">
              <div className="flex flex-wrap gap-2">
                {amenities.map((key) => (
                  <span
                    key={key}
                    className="rounded-full bg-stone-100 px-3.5 py-1.5 text-base font-semibold text-stone-700"
                  >
                    {AMENITY_BY_KEY[key]?.label ?? key}
                  </span>
                ))}
              </div>
            </CardSection>
          )}

          {/* Só a equipe (a ficha é protegida): aqui a posição pode ir ao navegador */}
          {property.source !== "LEAD" && (
            <CardSection title="📍 Localização no mapa (só a equipe vê)">
              <LocalizacaoImovel
                propertyId={property.id}
                latitude={property.latitude}
                longitude={property.longitude}
                geoPrecision={property.geoPrecision}
                addressVisibility={property.addressVisibility}
                tentou={property.geocodedAt !== null}
                temEndereco={temEndereco}
              />
            </CardSection>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <CardSection title="Resumo">
            <dl>
              <Info
                label="Finalidade"
                value={
                  property.purpose ? PURPOSE_LABELS[property.purpose] : null
                }
              />
              <Info
                label="Tipo"
                value={
                  property.propertyType
                    ? PROPERTY_TYPE_LABELS[property.propertyType]
                    : null
                }
              />
              <Info label="Quartos" value={property.bedrooms} />
              <Info label="Suítes" value={property.suites} />
              <Info label="Banheiros" value={property.bathrooms} />
              <Info label="Vagas" value={parking > 0 ? parking : null} />
              <Info
                label="Área útil"
                value={
                  property.usableArea ? formatArea(property.usableArea) : null
                }
              />
              <Info
                label="Área total"
                value={
                  property.totalArea ? formatArea(property.totalArea) : null
                }
              />
              <Info label="Andar" value={property.floor} />
              <Info label="Ano" value={property.yearBuilt} />
              <Info
                label="Mobília"
                value={
                  property.furnished
                    ? labelOf(FURNISHED_OPTIONS, property.furnished)
                    : null
                }
              />
              <Info
                label="Sol"
                value={
                  property.solarPosition
                    ? labelOf(SOLAR_POSITIONS, property.solarPosition)
                    : null
                }
              />
              <Info
                label="Aceita pets"
                value={property.acceptsPets ? "Sim" : null}
              />
            </dl>
          </CardSection>

          <CardSection title="Valores">
            <dl>
              {property.priceOnRequest ? (
                <Info label="Preço" value="Sob consulta" />
              ) : (
                <>
                  <Info
                    label="Venda"
                    value={
                      property.salePrice ? formatBRL(property.salePrice) : null
                    }
                  />
                  <Info
                    label="Locação"
                    value={
                      property.rentPrice
                        ? `${formatBRL(property.rentPrice)}/mês`
                        : null
                    }
                  />
                  <Info
                    label="Diária"
                    value={
                      property.seasonDailyPrice
                        ? formatBRL(property.seasonDailyPrice)
                        : null
                    }
                  />
                </>
              )}
              <Info
                label="Condomínio"
                value={
                  property.condoFee
                    ? `${formatBRL(property.condoFee)}/mês`
                    : null
                }
              />
              <Info
                label="IPTU"
                value={
                  property.iptuValue
                    ? `${formatBRL(property.iptuValue)} ${property.iptuPeriod === "MENSAL" ? "/mês" : "/ano"}`
                    : null
                }
              />
              <Info
                label="Condições"
                value={
                  [
                    property.acceptsFinancing && "Financiamento",
                    property.acceptsFgts && "FGTS",
                    property.acceptsTrade && "Permuta",
                  ]
                    .filter(Boolean)
                    .join(" · ") || null
                }
              />
            </dl>
          </CardSection>

          <CardSection title="Endereço (interno)">
            <dl>
              <Info
                label="Endereço"
                value={
                  [property.street, property.streetNumber]
                    .filter(Boolean)
                    .join(", ") || null
                }
              />
              <Info label="Complemento" value={property.complement} />
              <Info label="Bairro" value={property.neighborhood} />
              <Info
                label="Cidade"
                value={`${property.city}/${property.state}`}
              />
              <Info label="CEP" value={property.cep} />
              <Info label="Condomínio" value={property.condoName} />
              <Info
                label="No anúncio"
                value={labelOf(
                  ADDRESS_VISIBILITY_OPTIONS,
                  property.addressVisibility,
                )}
              />
            </dl>
            <p className="mt-3 rounded-lg bg-stone-100 p-3 text-sm text-stone-500">
              O público nunca vê o endereço exato — apenas{" "}
              {property.addressVisibility === "OCULTO"
                ? "a cidade"
                : "cidade e bairro"}
              .
            </p>
          </CardSection>

          <CardSection
            title="Dados internos"
            action={<Lock className="size-5 text-stone-400" />}
          >
            <dl>
              <Info
                label="Corretor"
                value={property.broker?.name ?? null}
              />
              <Info
                label="Captado em"
                value={
                  property.capturedAt ? formatDate(property.capturedAt) : null
                }
              />
              <Info label="Proprietário" value={property.ownerName} />
              <Info label="Telefone" value={property.ownerPhone} />
              <Info label="E-mail" value={property.ownerEmail} />
              <Info
                label="Comissão"
                value={
                  property.commissionPct ? `${property.commissionPct}%` : null
                }
              />
              <Info
                label="Documentação"
                value={
                  property.docsStatus
                    ? labelOf(DOCS_STATUS_OPTIONS, property.docsStatus)
                    : null
                }
              />
            </dl>
            {property.internalNotes && (
              <p className="mt-3 whitespace-pre-line rounded-lg bg-amber-50 p-3 text-base text-amber-900">
                {property.internalNotes}
              </p>
            )}
            <p className="mt-3 text-sm text-stone-400">
              🔒 Estes dados nunca aparecem em anúncios, feeds ou descrições.
            </p>
          </CardSection>

          {property.source === "CORRETOR" && (
            <>
              <CardSection title="Site da FC Imóveis">
                <SitePublicacao
                  propertyId={property.id}
                  publishedOnSite={property.publishedOnSite}
                  propertyStatus={property.status}
                  publicUrl={`${base}/imovel/${property.id}`}
                />
              </CardSection>

              <CardSection title="Links exclusivos para clientes">
                <LinksPrivados
                  propertyId={property.id}
                  initialLinks={linksDto}
                />
              </CardSection>

              <CardSection title="Publicação nos portais">
                <PortalToggles
                  propertyId={property.id}
                  publications={dto.publications}
                  propertyStatus={property.status}
                  priceOnRequest={property.priceOnRequest}
                />
              </CardSection>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
