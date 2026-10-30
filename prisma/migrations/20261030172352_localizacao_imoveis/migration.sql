-- AlterTable
ALTER TABLE "Property" ADD COLUMN "geoKey" TEXT;
ALTER TABLE "Property" ADD COLUMN "geoPrecision" TEXT;
ALTER TABLE "Property" ADD COLUMN "geocodedAt" DATETIME;
ALTER TABLE "Property" ADD COLUMN "latitude" REAL;
ALTER TABLE "Property" ADD COLUMN "longitude" REAL;
