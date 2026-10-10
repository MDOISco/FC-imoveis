// Monta e serve um feed: seleciona imóveis, carimba firstPublishedAt e
// registra o acesso do portal.
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { buildVrsyncXml, isFeedReady, type FeedProperty } from "./vrsync";

export async function serveFeed(
  feedKey: "CANALPRO" | "CHAVES_NA_MAO" | "IMOVELWEB",
  portals: string[],
): Promise<Response> {
  const settings = await getSettings();

  const candidates = (await db.property.findMany({
    where: {
      source: "CORRETOR",
      status: "ATIVO",
      publications: { some: { portal: { in: portals }, enabled: true } },
    },
    include: {
      photos: { orderBy: { position: "asc" } },
      video: true,
    },
    orderBy: { createdAt: "asc" },
  })) as FeedProperty[];

  const included = candidates.filter(isFeedReady);

  // Carimba a primeira publicação (status "Publicado desde…")
  const now = new Date();
  const ids = included.map((p) => p.id);
  if (ids.length > 0) {
    await db.portalPublication.updateMany({
      where: {
        propertyId: { in: ids },
        portal: { in: portals },
        enabled: true,
        firstPublishedAt: null,
      },
      data: { firstPublishedAt: now },
    });
  }

  await db.feedAccess.upsert({
    where: { portalFeed: feedKey },
    update: { lastAccessAt: now, accessCount: { increment: 1 } },
    create: { portalFeed: feedKey, lastAccessAt: now, accessCount: 1 },
  });

  const xml = buildVrsyncXml(included, settings);
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
