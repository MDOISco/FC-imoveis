import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ImovelDetalhes } from "@/components/site/imovel-detalhes";
import { db } from "@/lib/db";
import {
  publicLocation,
  publicTitle,
  priceLabel,
  specsSummary,
} from "@/lib/property-display";
import { getSettings, publicBaseUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Só imóveis da imobiliária, ativos E publicados no site têm página pública. */
function findPublico(id: string) {
  return db.property.findFirst({
    where: { id, status: "ATIVO", source: "CORRETOR", publishedOnSite: true },
    include: { photos: { orderBy: { position: "asc" } }, video: true },
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const property = await findPublico(id);
  if (!property) return { title: "Imóvel não encontrado" };

  const settings = await getSettings();
  const cover =
    property.photos.find((f) => f.isCover) ?? property.photos[0] ?? null;
  const title = `${publicTitle(property)} — ${publicLocation(property)}`;
  const description = [priceLabel(property), specsSummary(property)]
    .filter(Boolean)
    .join(" · ");

  return {
    title,
    description,
    openGraph: {
      title: `${title} · ${settings.agencyName}`,
      description,
      // Foto de capa na pré-visualização do WhatsApp (precisa de URL absoluta)
      images: cover
        ? [`${publicBaseUrl(settings)}/api/arquivos/${cover.webPath}`]
        : undefined,
    },
  };
}

export default async function ImovelPublicoPage({ params }: Params) {
  const { id } = await params;
  const [property, settings] = await Promise.all([
    findPublico(id),
    getSettings(),
  ]);
  if (!property) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/site#imoveis"
        className="inline-flex min-h-12 items-center gap-1.5 text-lg font-semibold text-stone-500 hover:text-brand-800"
      >
        <ArrowLeft className="size-5" /> Ver todos os imóveis
      </Link>
      <div className="mt-3">
        <ImovelDetalhes
          property={property}
          whatsapp={settings.whatsapp}
          whatsappText={`Olá! Tenho interesse no imóvel ${property.refCode} (${publicLocation(property)}) que vi no site da FC Imóveis.`}
        />
      </div>
    </div>
  );
}
