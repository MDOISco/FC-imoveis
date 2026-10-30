"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/client-api";
import {
  ADDRESS_VISIBILITY_OPTIONS,
  AMENITY_BY_KEY,
  labelOf,
  PROPERTY_TYPE_LABELS,
  PURPOSE_LABELS,
} from "@/lib/constants";
import { formatArea, formatBRL } from "@/lib/format";
import { publicationPendencias } from "@/lib/validation/imovel";
import type { WizardProperty } from "@/lib/wizard-dto";
import { PortalToggles } from "@/components/ficha/portal-toggles";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "" || value === "—")
    return null;
  return (
    <div className="flex justify-between gap-4 border-b border-stone-100 py-2 last:border-0">
      <dt className="shrink-0 font-semibold text-stone-500">{label}</dt>
      <dd className="text-right text-stone-900">{value}</dd>
    </div>
  );
}

function Section({
  title,
  step,
  propertyId,
  children,
}: {
  title: string;
  step: number;
  propertyId: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border-2 border-stone-200 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-bold text-stone-900">{title}</h3>
        <Link
          href={`/imoveis/${propertyId}/editar?etapa=${step}`}
          className="inline-flex items-center gap-1 text-base font-semibold text-brand-700 hover:text-brand-900"
        >
          <Pencil className="size-4" /> Editar
        </Link>
      </div>
      {children}
    </section>
  );
}

export function Step8Revisao({
  property,
}: {
  property: WizardProperty;
  step?: number;
}) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);

  const pendencias = publicationPendencias({
    ...property,
    photosCount: property.photos.length,
  });
  const canPublish = pendencias.length === 0;
  const isActive = property.status === "ATIVO";

  async function publish() {
    setPublishing(true);
    try {
      await apiFetch(`/api/imoveis/${property.id}`, {
        method: "PATCH",
        body: { status: "ATIVO", wizardStep: 8 },
      });
      toast("🎉 Imóvel publicado! Ele já entra nos feeds dos portais ligados.");
      router.push(`/imoveis/${property.id}`);
      router.refresh();
    } catch (e) {
      toast(
        e instanceof ApiError ? e.message : "Não foi possível publicar.",
        "erro",
      );
      setPublishing(false);
    }
  }

  const parking =
    (property.parkingCovered ?? 0) + (property.parkingUncovered ?? 0);

  return (
    <div className="space-y-6">
      {/* Checklist de publicação */}
      <div
        className={`rounded-2xl border-2 p-5 ${
          canPublish
            ? "border-brand-300 bg-brand-50"
            : "border-amber-300 bg-amber-50"
        }`}
      >
        {canPublish ? (
          <p className="flex items-center gap-2 text-lg font-bold text-brand-900">
            <CheckCircle2 className="size-6 shrink-0" /> Tudo pronto para
            publicar!
          </p>
        ) : (
          <>
            <p className="flex items-center gap-2 text-lg font-bold text-amber-900">
              <CircleAlert className="size-6 shrink-0" /> Falta pouco! Antes de
              publicar:
            </p>
            <ul className="mt-3 space-y-1.5 pl-8 text-base text-amber-900">
              {pendencias.map((p) => (
                <li key={p} className="list-disc">
                  {p}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <Section title="Informações básicas" step={1} propertyId={property.id}>
        <dl>
          <Row label="Código" value={property.refCode} />
          <Row
            label="Finalidade"
            value={property.purpose ? PURPOSE_LABELS[property.purpose] : null}
          />
          <Row
            label="Tipo"
            value={
              property.propertyType
                ? PROPERTY_TYPE_LABELS[property.propertyType]
                : null
            }
          />
          <Row label="Título" value={property.title} />
          <Row label="Exclusividade" value={property.exclusive ? "Sim" : null} />
        </dl>
      </Section>

      <Section title="Endereço" step={2} propertyId={property.id}>
        <dl>
          <Row
            label="Endereço"
            value={[property.street, property.streetNumber]
              .filter(Boolean)
              .join(", ")}
          />
          <Row label="Bairro" value={property.neighborhood} />
          <Row label="Cidade" value={`${property.city}/${property.state}`} />
          <Row label="Condomínio" value={property.condoName} />
          <Row
            label="Visível no anúncio"
            value={labelOf(ADDRESS_VISIBILITY_OPTIONS, property.addressVisibility)}
          />
        </dl>
      </Section>

      <Section title="Características" step={3} propertyId={property.id}>
        <dl>
          <Row label="Quartos" value={property.bedrooms} />
          <Row label="Suítes" value={property.suites} />
          <Row label="Banheiros" value={property.bathrooms} />
          <Row label="Vagas" value={parking > 0 ? parking : null} />
          <Row
            label="Área útil"
            value={property.usableArea ? formatArea(property.usableArea) : null}
          />
          <Row
            label="Área total"
            value={property.totalArea ? formatArea(property.totalArea) : null}
          />
        </dl>
      </Section>

      <Section title="Comodidades" step={4} propertyId={property.id}>
        {property.amenities.length === 0 ? (
          <p className="text-stone-500">Nenhuma marcada.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {property.amenities.map((key) => (
              <span
                key={key}
                className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold text-stone-700"
              >
                {AMENITY_BY_KEY[key]?.label ?? key}
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title="Valores" step={5} propertyId={property.id}>
        <dl>
          {property.priceOnRequest ? (
            <Row label="Preço" value="Sob consulta" />
          ) : (
            <>
              <Row
                label="Venda"
                value={property.salePrice ? formatBRL(property.salePrice) : null}
              />
              <Row
                label="Locação"
                value={
                  property.rentPrice ? `${formatBRL(property.rentPrice)}/mês` : null
                }
              />
              <Row
                label="Diária (temporada)"
                value={
                  property.seasonDailyPrice
                    ? formatBRL(property.seasonDailyPrice)
                    : null
                }
              />
            </>
          )}
          <Row
            label="Condomínio"
            value={property.condoFee ? `${formatBRL(property.condoFee)}/mês` : null}
          />
          <Row
            label="Permuta"
            value={property.acceptsTrade ? "♻️ Sim — na página de Permutas" : null}
          />
        </dl>
      </Section>

      <Section title="Fotos e vídeo" step={6} propertyId={property.id}>
        <p className="text-stone-700">
          {property.photos.length} foto(s)
          {property.video ? " · 1 vídeo" : ""}
        </p>
      </Section>

      <Section title="Descrição" step={7} propertyId={property.id}>
        {property.description ? (
          <p className="max-h-40 overflow-y-auto whitespace-pre-line text-stone-700">
            {property.description}
          </p>
        ) : (
          <p className="text-stone-500">Ainda sem descrição.</p>
        )}
      </Section>

      <section className="rounded-2xl border-2 border-stone-200 p-4">
        <h3 className="mb-3 text-lg font-bold text-stone-900">
          Publicar em quais portais?
        </h3>
        <PortalToggles
          propertyId={property.id}
          publications={property.publications}
          propertyStatus={property.status}
          priceOnRequest={property.priceOnRequest}
        />
      </section>

      <div className="flex flex-col gap-3 border-t-2 border-stone-100 pt-6 sm:flex-row sm:justify-end">
        <Button
          variant="secondary"
          size="lg"
          disabled={publishing}
          onClick={() => router.push(isActive ? `/imoveis/${property.id}` : "/painel")}
        >
          {isActive ? "Voltar à ficha" : "Concluir como rascunho"}
        </Button>
        {!isActive && (
          <Button
            size="lg"
            disabled={publishing || !canPublish}
            onClick={publish}
          >
            {publishing ? (
              <Spinner className="border-white/40 border-t-white" />
            ) : (
              "🚀 Publicar imóvel"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
