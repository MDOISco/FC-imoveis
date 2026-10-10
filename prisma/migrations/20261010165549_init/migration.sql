-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "agencyName" TEXT NOT NULL DEFAULT 'FC Imóveis',
    "creci" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "publicBaseUrl" TEXT,
    "logoPath" TEXT,
    "watermarkDefault" BOOLEAN NOT NULL DEFAULT true,
    "watermarkPosition" TEXT NOT NULL DEFAULT 'CANTO',
    "watermarkOpacity" REAL NOT NULL DEFAULT 0.45,
    "anthropicApiKey" TEXT,
    "nextRefSeq" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Broker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "creci" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT,
    "accessToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "wizardStep" INTEGER NOT NULL DEFAULT 1,
    "source" TEXT NOT NULL DEFAULT 'CORRETOR',
    "leadId" TEXT,
    "purpose" TEXT,
    "propertyType" TEXT,
    "title" TEXT,
    "brokerId" TEXT,
    "capturedAt" DATETIME,
    "exclusive" BOOLEAN NOT NULL DEFAULT false,
    "cep" TEXT,
    "street" TEXT,
    "streetNumber" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT NOT NULL DEFAULT 'Bragança Paulista',
    "state" TEXT NOT NULL DEFAULT 'SP',
    "condoName" TEXT,
    "addressVisibility" TEXT NOT NULL DEFAULT 'BAIRRO',
    "bedrooms" INTEGER,
    "suites" INTEGER,
    "bathrooms" INTEGER,
    "parkingCovered" INTEGER,
    "parkingUncovered" INTEGER,
    "usableArea" REAL,
    "totalArea" REAL,
    "floor" INTEGER,
    "totalFloors" INTEGER,
    "yearBuilt" INTEGER,
    "furnished" TEXT,
    "acceptsPets" BOOLEAN NOT NULL DEFAULT false,
    "solarPosition" TEXT,
    "amenities" TEXT NOT NULL DEFAULT '[]',
    "salePrice" INTEGER,
    "rentPrice" INTEGER,
    "seasonDailyPrice" INTEGER,
    "condoFee" INTEGER,
    "iptuValue" INTEGER,
    "iptuPeriod" TEXT NOT NULL DEFAULT 'ANUAL',
    "acceptsFinancing" BOOLEAN NOT NULL DEFAULT false,
    "acceptsFgts" BOOLEAN NOT NULL DEFAULT false,
    "acceptsTrade" BOOLEAN NOT NULL DEFAULT false,
    "priceOnRequest" BOOLEAN NOT NULL DEFAULT false,
    "ownerName" TEXT,
    "ownerPhone" TEXT,
    "ownerEmail" TEXT,
    "commissionPct" REAL,
    "docsStatus" TEXT,
    "internalNotes" TEXT,
    "description" TEXT,
    "descriptionStyle" TEXT,
    "leadDescription" TEXT,
    "rejectionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Property_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "caption" TEXT,
    "rotation" INTEGER NOT NULL DEFAULT 0,
    "enhance" BOOLEAN NOT NULL DEFAULT false,
    "watermark" BOOLEAN NOT NULL DEFAULT true,
    "originalPath" TEXT NOT NULL,
    "webPath" TEXT NOT NULL,
    "thumbPath" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Photo_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "originalName" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Video_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PortalPublication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "portal" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "firstPublishedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PortalPublication_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeedAccess" (
    "portalFeed" TEXT NOT NULL PRIMARY KEY,
    "lastAccessAt" DATETIME,
    "accessCount" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "TradePreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "types" TEXT NOT NULL DEFAULT '[]',
    "cities" TEXT NOT NULL DEFAULT '["Bragança Paulista"]',
    "neighborhoods" TEXT NOT NULL DEFAULT '[]',
    "minBedrooms" INTEGER,
    "minParking" INTEGER,
    "minUsableArea" REAL,
    "maxValue" INTEGER,
    "cashTopUp" TEXT NOT NULL DEFAULT 'INDIFERENTE',
    "notes" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TradePreference_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Swipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromPropertyId" TEXT NOT NULL,
    "toPropertyId" TEXT NOT NULL,
    "liked" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Swipe_fromPropertyId_fkey" FOREIGN KEY ("fromPropertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Swipe_toPropertyId_fkey" FOREIGN KEY ("toPropertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TradeMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyAId" TEXT NOT NULL,
    "propertyBId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOVO',
    "seenByA" BOOLEAN NOT NULL DEFAULT false,
    "seenByB" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TradeMatch_propertyAId_fkey" FOREIGN KEY ("propertyAId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TradeMatch_propertyBId_fkey" FOREIGN KEY ("propertyBId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AddressRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "leadId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOVO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AddressRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_accessToken_key" ON "Lead"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "Property_refCode_key" ON "Property"("refCode");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "Property_neighborhood_idx" ON "Property"("neighborhood");

-- CreateIndex
CREATE INDEX "Property_propertyType_idx" ON "Property"("propertyType");

-- CreateIndex
CREATE INDEX "Property_source_status_idx" ON "Property"("source", "status");

-- CreateIndex
CREATE INDEX "Photo_propertyId_position_idx" ON "Photo"("propertyId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Video_propertyId_key" ON "Video"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "PortalPublication_propertyId_portal_key" ON "PortalPublication"("propertyId", "portal");

-- CreateIndex
CREATE UNIQUE INDEX "TradePreference_propertyId_key" ON "TradePreference"("propertyId");

-- CreateIndex
CREATE INDEX "Swipe_toPropertyId_liked_idx" ON "Swipe"("toPropertyId", "liked");

-- CreateIndex
CREATE UNIQUE INDEX "Swipe_fromPropertyId_toPropertyId_key" ON "Swipe"("fromPropertyId", "toPropertyId");

-- CreateIndex
CREATE UNIQUE INDEX "TradeMatch_propertyAId_propertyBId_key" ON "TradeMatch"("propertyAId", "propertyBId");

-- CreateIndex
CREATE INDEX "AddressRequest_status_idx" ON "AddressRequest"("status");
