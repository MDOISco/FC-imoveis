// "Autenticação" do lead por link privado (token secreto na URL).
import type { Lead, Photo, Property, TradePreference, Video } from "@prisma/client";
import { db } from "@/lib/db";

export type LeadWithProperty = Lead & {
  properties: Array<
    Property & {
      photos: Photo[];
      video: Video | null;
      tradePreference: TradePreference | null;
    }
  >;
};

export async function getLeadByToken(
  token: string,
): Promise<LeadWithProperty | null> {
  if (!token || token.length < 10) return null;
  return db.lead.findUnique({
    where: { accessToken: token },
    include: {
      properties: {
        include: {
          photos: { orderBy: { position: "asc" } },
          video: true,
          tradePreference: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}
