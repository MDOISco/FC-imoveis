import Link from "next/link";
import {
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Car,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Ruler,
} from "lucide-react";
import type { Photo, Property, Video } from "@prisma/client";
import { Galeria } from "@/components/ficha/galeria";
import { PertoDoImovel } from "@/components/site/perto-do-imovel";
import { Badge } from "@/components/ui/badge";
import type { ItemPerto } from "@/lib/cidade/perto";
import {
  AMENITY_BY_KEY,
  FURNISHED_OPTIONS,
  labelOf,
  parseAmenities,
  PROPERTY_TYPE_LABELS,
  PURPOSE_LABELS,
  SOLAR_POSITIONS,
  STATUS_LABELS,
} from "@/lib/constants";
import { formatArea, formatBRL } from "@/lib/format";
import {
  priceLabel,
  publicLocation,
  publicTitle,
  totalParking,
} from "@/lib/property-display";
import { waHref } from "@/lib/whatsapp";

export type DetalheProperty = Property & { photos: Photo[]; video: Video | null };

function Linha({
  label,
  value,
  dark = false,
}: {
  label: string;
  value: React.ReactNode;
  dark?: boolean; // versão para fundo escuro (cartão de valor)
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div
      className={`flex justify-between gap-4 border-b py-2.5 last:border-0 ${
        dark ? "border-white/10" : "border-stone-100"
      }`}
    >
      <dt
        className={`shrink-0 font-semibold ${dark ? "text-brand-200" : "text-stone-500"}`}
      >
        {label}
      </dt>
      <dd
        className={`text-right font-medium ${dark ? "text-white" : "text-stone-900"}`}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * Apresentação COMPLETA e pública de um imóvel: usada na página do site
 * (/imovel/[id]) e no link exclusivo do cliente (/exclusivo/[token]).
 * Privacidade: só cidade/bairro (publicLocation) — nunca rua, número ou CEP,
 * e nenhum dado interno (proprietário, comissão, anotações). "O que tem
 * perto" chega pronto da página (pertoDoImovel/centroDoImovel no servidor):
 * a coordenada do imóvel nunca é passada adiante.
 */
export function ImovelDetalhes({
  property,
  whatsapp,
  whatsappText,
  perto = [],
  centro = null,
  linkMapa = false,
}: {
  property: DetalheProperty;
  whatsapp: string | null; // número salvo em Configurações
  whatsappText: string;
  perto?: ItemPerto[]; // lugares perto, só com FAIXA de distância
  centro?: string | null; // "até 10 km do Centro"
  linkMapa?: boolean; // mostra o link para o mapa da cidade
}) {
  const zap = waHref(whatsapp, whatsappText);
  const parking = totalParking(property);
  const amenities = parseAmenities(property.amenities);
  const fotos = property.photos.map((f) => ({
    id: f.id,
    position: f.position,
    isCover: f.isCover,
    caption: f.caption,
    rotation: f.rotation,
    enhance: f.enhance,
    watermark: f.watermark,
    webPath: f.webPath,
    thumbPath: f.thumbPath,
    version: f.updatedAt.getTime(),
  }));
  const video = property.video
    ? {
        id: property.video.id,
        path: property.video.path,
        originalName: property.video.originalName,
        mimeType: property.video.mimeType,
        sizeBytes: property.video.sizeBytes,
      }
    : null;

  const indisponivel = ["RESERVADO", "VENDIDO", "ALUGADO"].includes(
    property.status,
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {property.purpose && (
            <Badge className="bg-brand-900 text-white">
              {PURPOSE_LABELS[property.purpose]}
            </Badge>
          )}
          {property.acceptsTrade && (
            <Badge className="bg-gold-400 text-gold-950">
              🔑 Aceita permuta
            </Badge>
          )}
          {indisponivel && (
            <Badge className="bg-stone-200 text-stone-700">
              {STATUS_LABELS[property.status]}
            </Badge>
          )}
          <span className="text-base font-bold uppercase tracking-[0.12em] text-gold-700">
            {property.refCode}
            {property.propertyType &&
              ` · ${PROPERTY_TYPE_LABELS[property.propertyType]}`}
          </span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-stone-900 sm:text-4xl">
          {publicTitle(property)}
        </h1>
        <div className="mt-3 h-0.5 w-16 bg-gold-400" aria-hidden="true" />
        <p className="mt-3 inline-flex items-center gap-1.5 text-lg text-stone-600">
          <MapPin className="size-5 shrink-0 text-brand-600" />
          {publicLocation(property)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Coluna principal: fotos + descrição */}
        <div className="space-y-6 lg:col-span-3">
          <div data-secao="Fotos">
            <Galeria
              photos={fotos}
              video={video}
              title={publicTitle(property)}
            />
          </div>

          {/* Números rápidos */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {property.bedrooms ? (
              <div className="rounded-2xl border border-stone-200 bg-white p-4 text-center">
                <BedDouble className="mx-auto size-7 text-brand-700" />
                <p className="mt-1 text-xl font-bold text-stone-900">
                  {property.bedrooms}
                </p>
                <p className="text-sm font-semibold text-stone-500">
                  quarto{property.bedrooms > 1 ? "s" : ""}
                  {property.suites
                    ? ` (${property.suites} suíte${property.suites > 1 ? "s" : ""})`
                    : ""}
                </p>
              </div>
            ) : null}
            {property.bathrooms ? (
              <div className="rounded-2xl border border-stone-200 bg-white p-4 text-center">
                <Bath className="mx-auto size-7 text-brand-700" />
                <p className="mt-1 text-xl font-bold text-stone-900">
                  {property.bathrooms}
                </p>
                <p className="text-sm font-semibold text-stone-500">
                  banheiro{property.bathrooms > 1 ? "s" : ""}
                </p>
              </div>
            ) : null}
            {parking > 0 && (
              <div className="rounded-2xl border border-stone-200 bg-white p-4 text-center">
                <Car className="mx-auto size-7 text-brand-700" />
                <p className="mt-1 text-xl font-bold text-stone-900">
                  {parking}
                </p>
                <p className="text-sm font-semibold text-stone-500">
                  vaga{parking > 1 ? "s" : ""}
                </p>
              </div>
            )}
            {(property.usableArea ?? property.totalArea) ? (
              <div className="rounded-2xl border border-stone-200 bg-white p-4 text-center">
                <Ruler className="mx-auto size-7 text-brand-700" />
                <p className="mt-1 text-xl font-bold text-stone-900">
                  {formatArea(
                    (property.usableArea ?? property.totalArea) as number,
                  )}
                </p>
                <p className="text-sm font-semibold text-stone-500">
                  {property.usableArea ? "área útil" : "área total"}
                </p>
              </div>
            ) : null}
          </div>

          {property.description && (
            <section
              data-secao="Sobre este imóvel"
              className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8"
            >
              <h2 className="font-display text-2xl font-bold text-stone-900">
                Sobre este imóvel
              </h2>
              <div className="mt-2 h-0.5 w-12 bg-gold-400" aria-hidden="true" />
              <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-stone-700">
                {property.description}
              </p>
            </section>
          )}

          {amenities.length > 0 && (
            <section
              data-secao="Comodidades"
              className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8"
            >
              <h2 className="font-display text-2xl font-bold text-stone-900">
                Comodidades
              </h2>
              <div className="mb-1 mt-2 h-0.5 w-12 bg-gold-400" aria-hidden="true" />
              <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                {amenities.map((key) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-2 text-lg text-stone-700"
                  >
                    <CheckCircle2 className="size-5 shrink-0 text-brand-600" />
                    {AMENITY_BY_KEY[key]?.label ?? key}
                  </span>
                ))}
              </div>
            </section>
          )}

          <PertoDoImovel itens={perto} centro={centro} linkMapa={linkMapa} />
        </div>

        {/* Coluna lateral: preço, contato e detalhes */}
        <div className="space-y-6 lg:col-span-2">
          <section
            data-secao="Valor e contato"
            className="overflow-hidden rounded-2xl border-2 border-gold-400/60 bg-brand-950 p-6 text-white shadow-lg sm:p-7"
          >
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-gold-300">
              Valor
            </p>
            <p className="mt-1 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
              {priceLabel(property)}
            </p>
            <dl className="mt-3">
              <Linha
                dark
                label="Condomínio"
                value={
                  property.condoFee
                    ? `${formatBRL(property.condoFee)}/mês`
                    : null
                }
              />
              <Linha
                dark
                label="IPTU"
                value={
                  property.iptuValue
                    ? `${formatBRL(property.iptuValue)} ${property.iptuPeriod === "MENSAL" ? "/mês" : "/ano"}`
                    : null
                }
              />
              <Linha
                dark
                label="Facilidades"
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
            <div className="mt-5 flex flex-col gap-3">
              {zap && (
                <a
                  href={zap}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-atividade="WHATSAPP"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-gold-400 px-6 text-lg font-extrabold text-gold-950 shadow-lg transition-colors hover:bg-gold-300"
                >
                  <MessageCircle className="size-6" /> Falar no WhatsApp
                </a>
              )}
              <Link
                href={`/agendar?imovel=${property.id}`}
                data-atividade="AGENDAR"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-white/40 px-6 text-lg font-bold text-white transition-colors hover:border-gold-300 hover:text-gold-200"
              >
                <CalendarDays className="size-6" /> Agendar visita
              </Link>
            </div>
            <p className="mt-4 rounded-xl bg-white/10 p-3 text-base text-brand-100">
              Por segurança, mostramos apenas cidade e bairro. A Cátia ou o
              Francisco informam a localização exata no atendimento.
            </p>
          </section>

          <section
            data-secao="Detalhes"
            className="rounded-2xl border border-stone-200 bg-white p-6"
          >
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-stone-900">
              <Building2 className="size-6 text-brand-700" /> Detalhes
            </h2>
            <div className="mt-2 h-0.5 w-12 bg-gold-400" aria-hidden="true" />
            <dl className="mt-2">
              <Linha
                label="Finalidade"
                value={
                  property.purpose ? PURPOSE_LABELS[property.purpose] : null
                }
              />
              <Linha
                label="Tipo"
                value={
                  property.propertyType
                    ? PROPERTY_TYPE_LABELS[property.propertyType]
                    : null
                }
              />
              <Linha label="Referência" value={property.refCode} />
              <Linha
                label="Área útil"
                value={
                  property.usableArea ? formatArea(property.usableArea) : null
                }
              />
              <Linha
                label="Área total"
                value={
                  property.totalArea ? formatArea(property.totalArea) : null
                }
              />
              <Linha
                label="Andar"
                value={
                  property.floor
                    ? `${property.floor}º${property.totalFloors ? ` de ${property.totalFloors}` : ""}`
                    : null
                }
              />
              <Linha label="Ano de construção" value={property.yearBuilt} />
              <Linha
                label="Mobília"
                value={
                  property.furnished
                    ? labelOf(FURNISHED_OPTIONS, property.furnished)
                    : null
                }
              />
              <Linha
                label="Posição do sol"
                value={
                  property.solarPosition
                    ? labelOf(SOLAR_POSITIONS, property.solarPosition)
                    : null
                }
              />
              <Linha
                label="Aceita pets"
                value={property.acceptsPets ? "Sim" : null}
              />
              {/* Nome do condomínio fica de fora: identifica o endereço exato. */}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
