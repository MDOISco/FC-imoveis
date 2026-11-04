// Seed de demonstração: configurações, corretores e imóveis de exemplo com
// fotos geradas pelo pipeline real (sharp + marca d'água).
// Rode do zero com: npx prisma migrate reset
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const db = new PrismaClient();
const STORAGE = path.join(process.cwd(), "storage");

/** Gera uma "foto" de demonstração (gradiente colorido) já nos 3 tamanhos. */
async function demoPhoto(
  propertyId: string,
  photoId: string,
  hue: [number, number, number],
  label: string,
): Promise<{ originalPath: string; webPath: string; thumbPath: string }> {
  const w = 1600;
  const h = 1200;
  const buf = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      buf[i] = Math.min(255, Math.round(hue[0] + (90 * x) / w));
      buf[i + 1] = Math.min(255, Math.round(hue[1] + (70 * y) / h));
      buf[i + 2] = Math.min(255, Math.round(hue[2] + (50 * (x + y)) / (w + h)));
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <text x="50%" y="52%" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif"
      font-size="110" font-weight="bold" fill="#ffffff" fill-opacity="0.85">${label}</text>
  </svg>`;

  let base = sharp(buf, { raw: { width: w, height: h, channels: 3 } });
  try {
    base = base.composite([{ input: Buffer.from(svg) }]);
  } catch {
    // sem fontes no sistema: segue sem o texto
  }
  const original = await base.jpeg({ quality: 90 }).toBuffer();

  const dir = path.join(STORAGE, "properties", propertyId, "photos", photoId);
  await mkdir(dir, { recursive: true });
  const originalPath = `properties/${propertyId}/photos/${photoId}/original.jpg`;
  const webPath = `properties/${propertyId}/photos/${photoId}/web.jpg`;
  const thumbPath = `properties/${propertyId}/photos/${photoId}/thumb.webp`;

  await writeFile(path.join(STORAGE, originalPath), original);
  const web = await sharp(original)
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
  await writeFile(path.join(STORAGE, webPath), web);
  const thumb = await sharp(web).resize({ width: 400 }).webp({ quality: 75 }).toBuffer();
  await writeFile(path.join(STORAGE, thumbPath), thumb);

  return { originalPath, webPath, thumbPath };
}

async function addPhotos(
  propertyId: string,
  specs: Array<{ hue: [number, number, number]; label: string }>,
) {
  let position = 0;
  for (const spec of specs) {
    const photo = await db.photo.create({
      data: {
        propertyId,
        position,
        isCover: position === 0,
        watermark: false,
        originalPath: "pendente",
        webPath: "pendente",
        thumbPath: "pendente",
      },
    });
    const paths = await demoPhoto(propertyId, photo.id, spec.hue, spec.label);
    await db.photo.update({
      where: { id: photo.id },
      data: { ...paths, width: 1600, height: 1200 },
    });
    position += 1;
  }
}

async function main() {
  await db.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      agencyName: "FC Imóveis",
      tradeName: "F C Bragança Imóveis",
      cnpj: "69.870.684/0001-89",
      responsibleBroker: "Francisco A. D'Errico",
      creci: "152813-F",
      phone: "(11) 4034-0000",
      whatsapp: "(11) 99999-0000",
      email: "contato@fcimoveis.com.br",
      publicBaseUrl: process.env.APP_URL ?? "http://localhost:3000",
      nextRefSeq: 6,
    },
  });

  // Corretores da FC Imóveis (telefone e CRECI podem ser completados em
  // Configurações → Corretores)
  for (const b of [{ name: "Cátia" }, { name: "Francisco" }]) {
    const exists = await db.broker.findFirst({ where: { name: b.name } });
    if (!exists) await db.broker.create({ data: b });
  }
  const brokerCatia = await db.broker.findFirst({ where: { name: "Cátia" } });
  const brokerFrancisco = await db.broker.findFirst({
    where: { name: "Francisco" },
  });

  // FC-0001 — rascunho (demonstra o "Continuar cadastro")
  if (!(await db.property.findUnique({ where: { refCode: "FC-0001" } }))) {
    await db.property.create({
      data: {
        refCode: "FC-0001",
        status: "RASCUNHO",
        wizardStep: 3,
        purpose: "VENDA",
        propertyType: "CASA_CONDOMINIO",
        title: "Casa em condomínio no Jardim das Palmeiras",
        brokerId: brokerCatia?.id,
        capturedAt: new Date(),
        cep: "12916-000",
        street: "Rua das Palmeiras",
        streetNumber: "120",
        neighborhood: "Jardim das Palmeiras",
        city: "Bragança Paulista",
        bedrooms: 3,
        suites: 1,
        bathrooms: 2,
        parkingCovered: 2,
        usableArea: 180,
        totalArea: 300,
        amenities: JSON.stringify(["piscina", "churrasqueira", "portaria-24h"]),
      },
    });
  }

  // FC-0002 — ativo, publicado, com tag PERMUTA e 3 fotos
  if (!(await db.property.findUnique({ where: { refCode: "FC-0002" } }))) {
    const p = await db.property.create({
      data: {
        refCode: "FC-0002",
        status: "ATIVO",
        wizardStep: 8,
        purpose: "VENDA",
        propertyType: "APARTAMENTO",
        title: "Apartamento com varanda no Centro",
        brokerId: brokerFrancisco?.id,
        capturedAt: new Date(),
        street: "Rua Coronel João Leme",
        streetNumber: "45",
        neighborhood: "Centro",
        city: "Bragança Paulista",
        cep: "12900-010",
        bedrooms: 3,
        suites: 1,
        bathrooms: 2,
        parkingCovered: 2,
        usableArea: 110,
        floor: 5,
        totalFloors: 12,
        yearBuilt: 2018,
        furnished: "SEMI",
        amenities: JSON.stringify([
          "varanda",
          "academia",
          "salao-festas",
          "portaria-24h",
          "elevador",
        ]),
        salePrice: 520000,
        condoFee: 650,
        iptuValue: 1800,
        acceptsFinancing: true,
        acceptsFgts: true,
        acceptsTrade: true,
        ownerName: "Sr. Antônio",
        ownerPhone: "(11) 98888-7777",
        description:
          "Apartamento com varanda no Centro de Bragança Paulista, à venda. São 3 quartos (1 suíte), 2 banheiros e 2 vagas de garagem, com 110 m² muito bem distribuídos no 5º andar.\n\nO condomínio oferece academia, salão de festas, portaria 24h e elevador. Aceita financiamento e FGTS — e estuda permuta.\n\nAgende sua visita com a FC Imóveis. Referência FC-0002.",
        descriptionStyle: "OBJETIVA",
        publications: {
          create: [
            { portal: "ZAP", enabled: true },
            { portal: "VIVAREAL", enabled: true },
            { portal: "CHAVES_NA_MAO", enabled: true },
          ],
        },
      },
    });
    await addPhotos(p.id, [
      { hue: [60, 110, 90], label: "Sala" },
      { hue: [120, 90, 60], label: "Cozinha" },
      { hue: [70, 80, 130], label: "Varanda" },
    ]);
  }

  // Leads de permuta com preferências cruzadas (prontos para dar match)
  const mariaExists = await db.property.findUnique({
    where: { refCode: "FC-0003" },
  });
  if (!mariaExists) {
    const maria = await db.lead.create({
      data: {
        name: "Maria Aparecida",
        whatsapp: "(11) 98888-1111",
        email: "maria.exemplo@email.com",
      },
    });
    const casaMaria = await db.property.create({
      data: {
        refCode: "FC-0003",
        source: "LEAD",
        leadId: maria.id,
        status: "ATIVO",
        purpose: "VENDA",
        acceptsTrade: true,
        propertyType: "CASA",
        neighborhood: "Jardim América",
        city: "Bragança Paulista",
        bedrooms: 2,
        bathrooms: 1,
        parkingCovered: 1,
        usableArea: 90,
        totalArea: 200,
        salePrice: 340000,
        leadDescription:
          "Casa muito bem cuidada, com quintal gostoso, perto de escola e mercado. Sol da manhã no quintal.",
        description:
          "Casa à venda no Jardim América, em Bragança Paulista: 2 quartos, quintal amplo e ótima localização, perto de escola e mercado. Disponível para permuta — fale com a FC Imóveis (ref. FC-0003).",
        descriptionStyle: "PROPRIA",
        wizardStep: 8,
        tradePreference: {
          create: {
            types: JSON.stringify(["APARTAMENTO", "CASA_CONDOMINIO"]),
            neighborhoods: JSON.stringify(["Centro"]),
            minBedrooms: 2,
            maxValue: 600000,
            cashTopUp: "PODE_PAGAR",
          },
        },
      },
    });
    await addPhotos(casaMaria.id, [
      { hue: [130, 100, 60], label: "Fachada" },
      { hue: [90, 130, 80], label: "Quintal" },
    ]);
  }

  const joaoExists = await db.property.findUnique({
    where: { refCode: "FC-0004" },
  });
  if (!joaoExists) {
    const joao = await db.lead.create({
      data: { name: "João Batista", whatsapp: "(11) 97777-2222" },
    });
    const aptoJoao = await db.property.create({
      data: {
        refCode: "FC-0004",
        source: "LEAD",
        leadId: joao.id,
        status: "ATIVO",
        purpose: "VENDA",
        acceptsTrade: true,
        propertyType: "APARTAMENTO",
        neighborhood: "Centro",
        city: "Bragança Paulista",
        bedrooms: 3,
        bathrooms: 2,
        parkingCovered: 1,
        usableArea: 85,
        salePrice: 380000,
        leadDescription:
          "Apartamento de 3 quartos no centro, pertinho de tudo. Prédio tranquilo, andar alto, bem arejado.",
        description:
          "Apartamento à venda no Centro de Bragança Paulista: 3 quartos, andar alto e muita praticidade no dia a dia. Disponível para permuta — fale com a FC Imóveis (ref. FC-0004).",
        descriptionStyle: "PROPRIA",
        wizardStep: 8,
        tradePreference: {
          create: {
            types: JSON.stringify(["CASA", "SOBRADO"]),
            neighborhoods: JSON.stringify(["Jardim América", "Jardim das Palmeiras"]),
            minBedrooms: 2,
            cashTopUp: "QUER_RECEBER",
          },
        },
      },
    });
    await addPhotos(aptoJoao.id, [
      { hue: [80, 90, 140], label: "Sala" },
      { hue: [140, 110, 80], label: "Quarto" },
    ]);
  }

  // Ana — cadastro aguardando aprovação (demonstra a fila do admin)
  if (!(await db.property.findUnique({ where: { refCode: "FC-0005" } }))) {
    const ana = await db.lead.create({
      data: { name: "Ana Lúcia", whatsapp: "(11) 96666-5555" },
    });
    const chacara = await db.property.create({
      data: {
        refCode: "FC-0005",
        source: "LEAD",
        leadId: ana.id,
        status: "EM_APROVACAO",
        purpose: "VENDA",
        acceptsTrade: true,
        propertyType: "CHACARA",
        neighborhood: "Zona Rural",
        city: "Bragança Paulista",
        bedrooms: 3,
        bathrooms: 2,
        totalArea: 2000,
        salePrice: 550000,
        leadDescription:
          "Chácara com pomar formado, poço artesiano e espaço para horta. Lugar muito tranquilo, bom para descansar no fim de semana.",
        wizardStep: 8,
        tradePreference: {
          create: {
            types: JSON.stringify(["APARTAMENTO"]),
            neighborhoods: JSON.stringify(["Centro"]),
            cashTopUp: "INDIFERENTE",
          },
        },
      },
    });
    await addPhotos(chacara.id, [{ hue: [70, 130, 70], label: "Chácara" }]);
  }

  // FC-0006 — casa da Regina (venda e locação), para a visão por corretor
  if (!(await db.property.findUnique({ where: { refCode: "FC-0006" } }))) {
    const p = await db.property.create({
      data: {
        refCode: "FC-0006",
        status: "ATIVO",
        wizardStep: 8,
        purpose: "VENDA_LOCACAO",
        propertyType: "SOBRADO",
        title: "Sobrado amplo no Jardim do Lago",
        brokerId: brokerCatia?.id,
        capturedAt: new Date(),
        neighborhood: "Jardim do Lago",
        city: "Bragança Paulista",
        bedrooms: 4,
        suites: 2,
        bathrooms: 3,
        parkingCovered: 2,
        parkingUncovered: 2,
        usableArea: 240,
        totalArea: 360,
        yearBuilt: 2012,
        amenities: JSON.stringify([
          "churrasqueira",
          "quintal",
          "portao-eletronico",
          "cameras",
        ]),
        salePrice: 780000,
        rentPrice: 4200,
        iptuValue: 2600,
        acceptsFinancing: true,
        ownerName: "Dona Helena",
        ownerPhone: "(11) 97777-8888",
        description:
          "Sobrado amplo no Jardim do Lago, à venda e para locação. São 4 quartos (2 suítes), 3 banheiros e 4 vagas de garagem, com 240 m² de área construída em um terreno de 360 m².\n\nÁrea externa com churrasqueira e quintal; segurança com portão eletrônico e câmeras.\n\nAgende sua visita com a FC Imóveis. Referência FC-0006.",
        descriptionStyle: "OBJETIVA",
        publications: { create: [{ portal: "ZAP", enabled: true }] },
      },
    });
    await addPhotos(p.id, [
      { hue: [110, 85, 95], label: "Fachada" },
      { hue: [85, 115, 75], label: "Quintal" },
    ]);
  }

  // Garante que o próximo código de referência não colide com os do seed
  const last = await db.property.findMany({
    select: { refCode: true },
    orderBy: { refCode: "desc" },
    take: 1,
  });
  const maxSeq = Number(last[0]?.refCode.replace(/\D/g, "") ?? 0);
  const settings = await db.settings.findUnique({ where: { id: 1 } });
  if (settings && settings.nextRefSeq <= maxSeq) {
    await db.settings.update({
      where: { id: 1 },
      data: { nextRefSeq: maxSeq + 1 },
    });
  }

  const leads = await db.lead.findMany({ select: { name: true, accessToken: true } });
  console.log("Seed concluído! Links privados dos leads de demonstração:");
  for (const l of leads) {
    console.log(`  ${l.name}: /permutas/painel/${l.accessToken}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
