-- CreateTable
CREATE TABLE "PrivateLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PrivateLink_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Property" (
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
    "publishedOnSite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Property_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Property" ("acceptsFgts", "acceptsFinancing", "acceptsPets", "acceptsTrade", "addressVisibility", "amenities", "bathrooms", "bedrooms", "brokerId", "capturedAt", "cep", "city", "commissionPct", "complement", "condoFee", "condoName", "createdAt", "description", "descriptionStyle", "docsStatus", "exclusive", "floor", "furnished", "id", "internalNotes", "iptuPeriod", "iptuValue", "leadDescription", "leadId", "neighborhood", "ownerEmail", "ownerName", "ownerPhone", "parkingCovered", "parkingUncovered", "priceOnRequest", "propertyType", "purpose", "refCode", "rejectionReason", "rentPrice", "salePrice", "seasonDailyPrice", "solarPosition", "source", "state", "status", "street", "streetNumber", "suites", "title", "totalArea", "totalFloors", "updatedAt", "usableArea", "wizardStep", "yearBuilt") SELECT "acceptsFgts", "acceptsFinancing", "acceptsPets", "acceptsTrade", "addressVisibility", "amenities", "bathrooms", "bedrooms", "brokerId", "capturedAt", "cep", "city", "commissionPct", "complement", "condoFee", "condoName", "createdAt", "description", "descriptionStyle", "docsStatus", "exclusive", "floor", "furnished", "id", "internalNotes", "iptuPeriod", "iptuValue", "leadDescription", "leadId", "neighborhood", "ownerEmail", "ownerName", "ownerPhone", "parkingCovered", "parkingUncovered", "priceOnRequest", "propertyType", "purpose", "refCode", "rejectionReason", "rentPrice", "salePrice", "seasonDailyPrice", "solarPosition", "source", "state", "status", "street", "streetNumber", "suites", "title", "totalArea", "totalFloors", "updatedAt", "usableArea", "wizardStep", "yearBuilt" FROM "Property";
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";
CREATE UNIQUE INDEX "Property_refCode_key" ON "Property"("refCode");
CREATE INDEX "Property_status_idx" ON "Property"("status");
CREATE INDEX "Property_neighborhood_idx" ON "Property"("neighborhood");
CREATE INDEX "Property_propertyType_idx" ON "Property"("propertyType");
CREATE INDEX "Property_source_status_idx" ON "Property"("source", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PrivateLink_token_key" ON "PrivateLink"("token");

-- CreateIndex
CREATE INDEX "PrivateLink_propertyId_idx" ON "PrivateLink"("propertyId");

-- Publicação inicial: os imóveis da imobiliária que JÁ estão ativos continuam
-- aparecendo no site (autorizado pela dona). Novos imóveis nascem despublicados
-- e só entram no site pelo botão "Publicar no site" da ficha.
UPDATE "Property"
SET "publishedOnSite" = true
WHERE "source" = 'CORRETOR' AND "status" = 'ATIVO';
