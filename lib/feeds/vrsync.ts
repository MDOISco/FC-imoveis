// Gerador do feed VRSync 2.0 (Carga XML lida pelos portais).
import type { Photo, Property, Settings, Video } from "@prisma/client";
import { parseAmenities, purposeIsSeason } from "@/lib/constants";
import { publicBaseUrl } from "@/lib/settings";
import { cdata, escapeXml, tag } from "./xml";
import {
  vrsyncDisplayAddress,
  vrsyncFeatures,
  vrsyncPropertyType,
  vrsyncTransactionType,
} from "./mapping";

export type FeedProperty = Property & { photos: Photo[]; video: Video | null };

/** Um imóvel só entra no feed se tem o mínimo que os portais exigem. */
export function isFeedReady(p: FeedProperty): boolean {
  if (!p.title || !p.description || p.photos.length === 0) return false;
  if (p.priceOnRequest) return false; // portais exigem preço
  const hasPrice =
    (p.salePrice ?? 0) > 0 ||
    (p.rentPrice ?? 0) > 0 ||
    (p.seasonDailyPrice ?? 0) > 0;
  return hasPrice;
}

function listingXml(p: FeedProperty, settings: Settings): string {
  const base = publicBaseUrl(settings);
  const photos = [...p.photos].sort(
    (a, b) => Number(b.isCover) - Number(a.isCover) || a.position - b.position,
  );

  const mediaItems = photos
    .map((photo, i) => {
      const url = `${base}/api/arquivos/${photo.webPath}?v=${photo.updatedAt.getTime()}`;
      const caption = photo.caption ? escapeXml(photo.caption) : undefined;
      return tag("Item", escapeXml(url), {
        medium: "image",
        caption,
        primary: i === 0 ? "true" : undefined,
      });
    })
    .join("");
  const videoItem = p.video
    ? tag("Item", escapeXml(`${base}/api/arquivos/${p.video.path}`), {
        medium: "video",
      })
    : "";

  const season = purposeIsSeason(p.purpose);
  const prices = [
    p.salePrice
      ? tag("ListPrice", p.salePrice, { currency: "BRL" })
      : "",
    p.rentPrice
      ? tag("RentalPrice", p.rentPrice, { currency: "BRL", period: "Monthly" })
      : "",
    season && p.seasonDailyPrice
      ? tag("RentalPrice", p.seasonDailyPrice, {
          currency: "BRL",
          period: "Daily",
        })
      : "",
    p.condoFee
      ? tag("PropertyAdministrationFee", p.condoFee, { currency: "BRL" })
      : "",
    p.iptuValue
      ? tag(
          "YearlyTax",
          p.iptuPeriod === "MENSAL" ? p.iptuValue * 12 : p.iptuValue,
          { currency: "BRL" },
        )
      : "",
  ].join("");

  const hideAll = p.addressVisibility === "OCULTO";
  const showFull = p.addressVisibility === "COMPLETO";
  const location = [
    tag("Country", "Brasil", { abbreviation: "BR" }),
    tag("State", "São Paulo", { abbreviation: escapeXml(p.state || "SP") }),
    tag("City", escapeXml(p.city)),
    !hideAll && p.neighborhood
      ? tag("Neighborhood", escapeXml(p.neighborhood))
      : "",
    showFull && p.street ? tag("Address", escapeXml(p.street)) : "",
    showFull && p.streetNumber
      ? tag("StreetNumber", escapeXml(p.streetNumber))
      : "",
    showFull && p.complement ? tag("Complement", escapeXml(p.complement)) : "",
    showFull && p.cep
      ? tag("PostalCode", escapeXml(p.cep.replace(/\D/g, "")))
      : "",
  ].join("");

  const parking = (p.parkingCovered ?? 0) + (p.parkingUncovered ?? 0);
  const features = vrsyncFeatures(parseAmenities(p.amenities))
    .map((f) => tag("Feature", escapeXml(f)))
    .join("");

  const details = [
    tag("PropertyType", escapeXml(vrsyncPropertyType(p.propertyType))),
    tag("Description", cdata(p.description ?? "")),
    prices,
    p.usableArea
      ? tag("LivingArea", p.usableArea, { unit: "square metres" })
      : "",
    p.totalArea ? tag("LotArea", p.totalArea, { unit: "square metres" }) : "",
    p.bedrooms ? tag("Bedrooms", p.bedrooms) : "",
    p.bathrooms ? tag("Bathrooms", p.bathrooms) : "",
    p.suites ? tag("Suites", p.suites) : "",
    parking > 0 ? tag("Garage", parking, { type: "Parking Space" }) : "",
    p.floor ? tag("UnitFloor", p.floor) : "",
    p.totalFloors ? tag("Buildings", p.totalFloors) : "",
    p.yearBuilt ? tag("YearBuilt", p.yearBuilt) : "",
    features ? `<Features>${features}</Features>` : "",
  ].join("");

  return [
    "<Listing>",
    tag("ListingID", escapeXml(p.refCode)),
    tag("Title", cdata(p.title ?? "")),
    tag("TransactionType", vrsyncTransactionType(p.purpose)),
    `<Media>${mediaItems}${videoItem}</Media>`,
    tag("LastUpdateDate", p.updatedAt.toISOString()),
    `<Location displayAddress="${vrsyncDisplayAddress(p.addressVisibility)}">${location}</Location>`,
    `<Details>${details}</Details>`,
    "</Listing>",
  ].join("");
}

export function buildVrsyncXml(
  properties: FeedProperty[],
  settings: Settings,
): string {
  const header = [
    "<Header>",
    tag("Provider", escapeXml(settings.agencyName)),
    tag("Email", escapeXml(settings.email ?? "")),
    tag("ContactName", escapeXml(settings.agencyName)),
    settings.phone ? tag("Telephone", escapeXml(settings.phone)) : "",
    tag("PublishDate", new Date().toISOString()),
    "</Header>",
  ].join("");

  const listings = properties.map((p) => listingXml(p, settings)).join("");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync"` +
    ` xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"` +
    ` xsi:schemaLocation="http://www.vivareal.com/schemas/1.0/VRSync http://xml.vivareal.com/vrsync.xsd">` +
    header +
    `<Listings>${listings}</Listings>` +
    `</ListingDataFeed>`
  );
}
