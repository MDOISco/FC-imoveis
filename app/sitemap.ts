import type { MetadataRoute } from "next";
import { SITE_BASE_WHERE } from "@/lib/busca-site";
import { db } from "@/lib/db";
import { getSettings, publicBaseUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Lista para o Google: páginas públicas + cada imóvel publicado no site
 *  (mesma regra da vitrine: ATIVO, da imobiliária e "Publicar no site"). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, imoveis] = await Promise.all([
    getSettings(),
    db.property.findMany({
      where: SITE_BASE_WHERE,
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  const base = publicBaseUrl(settings);
  const fixas = ["/", "/cidade", "/agendar", "/permutas"].map((p) => ({
    url: `${base}${p === "/" ? "" : p}`,
  }));
  return [
    ...fixas,
    ...imoveis.map((i) => ({
      url: `${base}/imovel/${i.id}`,
      lastModified: i.updatedAt,
    })),
  ];
}
