// DTO serializável (sem Date) do imóvel para os componentes de cliente do wizard.
import type {
  Photo,
  PortalPublication,
  Property,
  Video,
} from "@prisma/client";
import { parseAmenities } from "./constants";

export type WizardPhoto = {
  id: string;
  position: number;
  isCover: boolean;
  caption: string | null;
  rotation: number;
  enhance: boolean;
  watermark: boolean;
  webPath: string;
  thumbPath: string;
  version: number; // cache-buster (updatedAt em ms)
};

export type WizardVideo = {
  id: string;
  path: string;
  originalName: string | null;
  mimeType: string;
  sizeBytes: number;
};

export type WizardPublication = {
  portal: string;
  enabled: boolean;
  firstPublishedAt: string | null;
};

export type WizardProperty = {
  id: string;
  refCode: string;
  status: string;
  wizardStep: number;
  source: string;
  purpose: string | null;
  propertyType: string | null;
  title: string | null;
  brokerId: string | null;
  capturedAt: string | null; // AAAA-MM-DD
  exclusive: boolean;
  cep: string | null;
  street: string | null;
  streetNumber: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  condoName: string | null;
  addressVisibility: string;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parkingCovered: number | null;
  parkingUncovered: number | null;
  usableArea: number | null;
  totalArea: number | null;
  floor: number | null;
  totalFloors: number | null;
  yearBuilt: number | null;
  furnished: string | null;
  acceptsPets: boolean;
  solarPosition: string | null;
  amenities: string[];
  salePrice: number | null;
  rentPrice: number | null;
  seasonDailyPrice: number | null;
  condoFee: number | null;
  iptuValue: number | null;
  iptuPeriod: string;
  acceptsFinancing: boolean;
  acceptsFgts: boolean;
  acceptsTrade: boolean;
  priceOnRequest: boolean;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  commissionPct: number | null;
  docsStatus: string | null;
  internalNotes: string | null;
  description: string | null;
  descriptionStyle: string | null;
  leadDescription: string | null;
  photos: WizardPhoto[];
  video: WizardVideo | null;
  publications: WizardPublication[];
};

export function toWizardProperty(
  p: Property & {
    photos: Photo[];
    video: Video | null;
    publications: PortalPublication[];
  },
): WizardProperty {
  return {
    id: p.id,
    refCode: p.refCode,
    status: p.status,
    wizardStep: p.wizardStep,
    source: p.source,
    purpose: p.purpose,
    propertyType: p.propertyType,
    title: p.title,
    brokerId: p.brokerId,
    capturedAt: p.capturedAt ? p.capturedAt.toISOString().slice(0, 10) : null,
    exclusive: p.exclusive,
    cep: p.cep,
    street: p.street,
    streetNumber: p.streetNumber,
    complement: p.complement,
    neighborhood: p.neighborhood,
    city: p.city,
    state: p.state,
    condoName: p.condoName,
    addressVisibility: p.addressVisibility,
    bedrooms: p.bedrooms,
    suites: p.suites,
    bathrooms: p.bathrooms,
    parkingCovered: p.parkingCovered,
    parkingUncovered: p.parkingUncovered,
    usableArea: p.usableArea,
    totalArea: p.totalArea,
    floor: p.floor,
    totalFloors: p.totalFloors,
    yearBuilt: p.yearBuilt,
    furnished: p.furnished,
    acceptsPets: p.acceptsPets,
    solarPosition: p.solarPosition,
    amenities: parseAmenities(p.amenities),
    salePrice: p.salePrice,
    rentPrice: p.rentPrice,
    seasonDailyPrice: p.seasonDailyPrice,
    condoFee: p.condoFee,
    iptuValue: p.iptuValue,
    iptuPeriod: p.iptuPeriod,
    acceptsFinancing: p.acceptsFinancing,
    acceptsFgts: p.acceptsFgts,
    acceptsTrade: p.acceptsTrade,
    priceOnRequest: p.priceOnRequest,
    ownerName: p.ownerName,
    ownerPhone: p.ownerPhone,
    ownerEmail: p.ownerEmail,
    commissionPct: p.commissionPct,
    docsStatus: p.docsStatus,
    internalNotes: p.internalNotes,
    description: p.description,
    descriptionStyle: p.descriptionStyle,
    leadDescription: p.leadDescription,
    photos: p.photos.map((f) => ({
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
    })),
    video: p.video
      ? {
          id: p.video.id,
          path: p.video.path,
          originalName: p.video.originalName,
          mimeType: p.video.mimeType,
          sizeBytes: p.video.sizeBytes,
        }
      : null,
    publications: p.publications.map((pub) => ({
      portal: pub.portal,
      enabled: pub.enabled,
      firstPublishedAt: pub.firstPublishedAt
        ? pub.firstPublishedAt.toISOString()
        : null,
    })),
  };
}
