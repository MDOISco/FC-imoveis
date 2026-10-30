import type { MetadataRoute } from "next";
import { getSettings, publicBaseUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** O que o Google pode ler: o site público sim; painel da equipe, login,
 *  links exclusivos de clientes e APIs não (as fotos continuam liberadas). */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = publicBaseUrl(await getSettings());
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/arquivos/"],
      disallow: [
        "/painel",
        "/entrar",
        "/exclusivo/",
        "/permutas/painel/",
        "/api/",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
