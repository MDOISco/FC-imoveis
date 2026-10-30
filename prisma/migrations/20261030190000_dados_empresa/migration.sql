-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "tradeName" TEXT;
ALTER TABLE "Settings" ADD COLUMN "cnpj" TEXT;
ALTER TABLE "Settings" ADD COLUMN "responsibleBroker" TEXT;

-- Dados da empresa (comprovante do CNPJ de 29/10/2026), pedidos pela dona.
-- Depois disso, tudo pode ser alterado em Configurações → Imobiliária.
UPDATE "Settings"
SET "tradeName" = 'F C Bragança Imóveis',
    "cnpj" = '69.870.684/0001-89',
    "responsibleBroker" = 'Francisco A. D''Errico',
    "creci" = '152813-F'
WHERE "id" = 1;

UPDATE "Broker" SET "creci" = '152813-F'
WHERE "name" LIKE 'Francisco%' AND ("creci" IS NULL OR "creci" = '');
