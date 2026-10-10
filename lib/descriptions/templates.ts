// Gerador de descrições por templates: 3 estilos, frases sorteadas de pools,
// composição em parágrafos. Nenhuma frase cita fato ausente dos facts.
import { formatArea, formatBRL } from "@/lib/format";
import type { DescriptionFacts } from "./facts";
import { createRng, type Rng } from "./rng";

type Slot = (f: DescriptionFacts, rng: Rng) => string | null;
type StyleTemplate = Slot[][]; // parágrafos -> frases

/* ------------------------- fragmentos reutilizáveis ------------------------ */

function placeText(f: DescriptionFacts): string {
  if (f.condoName && f.neighborhood)
    return `no ${f.condoName}, ${f.neighborhood}, em ${f.city}`;
  if (f.condoName) return `no ${f.condoName}, em ${f.city}`;
  if (f.neighborhood) return `no bairro ${f.neighborhood}, em ${f.city}`;
  return `em ${f.city}`;
}

function actionText(f: DescriptionFacts): string {
  if (f.forSale && f.forRent) return "à venda e para locação";
  if (f.forRent) return "para locação";
  if (f.forSeason) return "para temporada";
  return "à venda";
}

function roomsText(f: DescriptionFacts): string | null {
  const parts: string[] = [];
  if (f.bedrooms) {
    parts.push(
      `${f.bedrooms} quarto${f.bedrooms > 1 ? "s" : ""}` +
        (f.suites ? ` (${f.suites} suíte${f.suites > 1 ? "s" : ""})` : ""),
    );
  }
  if (f.bathrooms)
    parts.push(`${f.bathrooms} banheiro${f.bathrooms > 1 ? "s" : ""}`);
  if (f.parking)
    parts.push(`${f.parking} vaga${f.parking > 1 ? "s" : ""} de garagem`);
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`;
}

function areaText(f: DescriptionFacts): string | null {
  if (f.usableArea && f.totalArea && f.totalArea > f.usableArea) {
    return `${formatArea(f.usableArea)} de área construída em um terreno de ${formatArea(f.totalArea)}`;
  }
  const area = f.usableArea ?? f.totalArea;
  return area ? `${formatArea(area)}` : null;
}

function allAmenities(f: DescriptionFacts): string[] {
  return [...f.amenities.lazer, ...f.amenities.seguranca, ...f.amenities.conforto];
}

function listPt(items: string[]): string {
  const lower = items.map((s) => s.toLowerCase());
  if (lower.length === 1) return lower[0];
  return `${lower.slice(0, -1).join(", ")} e ${lower[lower.length - 1]}`;
}

function priceText(f: DescriptionFacts): string | null {
  const parts: string[] = [];
  if (f.forSale && f.salePrice) parts.push(`${formatBRL(f.salePrice)} à venda`);
  if (f.forRent && f.rentPrice)
    parts.push(`${formatBRL(f.rentPrice)} por mês na locação`);
  if (f.forSeason && f.seasonDailyPrice)
    parts.push(`${formatBRL(f.seasonDailyPrice)} a diária`);
  return parts.length ? parts.join(" e ") : null;
}

/* ------------------------------ estilo OBJETIVA ---------------------------- */

const objetiva: StyleTemplate = [
  [
    (f, rng) =>
      rng.pick([
        `${f.typeLabel} ${actionText(f)} ${placeText(f)}.`,
        `${f.typeLabel} ${placeText(f)}, ${actionText(f)}.`,
        `Ótima oportunidade: ${f.typeLabel.toLowerCase()} ${actionText(f)} ${placeText(f)}.`,
      ]),
    (f) => {
      const rooms = roomsText(f);
      const area = areaText(f);
      if (rooms && area) return `São ${rooms}, com ${area}.`;
      if (rooms) return `São ${rooms}.`;
      if (area) return `Área de ${area}.`;
      return null;
    },
    (f) =>
      f.floor
        ? `A unidade fica no ${f.floor}º andar.`
        : null,
    (f) => (f.yearBuilt ? `Construção de ${f.yearBuilt}.` : null),
    (f) =>
      f.furnished === "SIM"
        ? "O imóvel é mobiliado."
        : f.furnished === "SEMI"
          ? "O imóvel é semimobiliado."
          : null,
    (f) =>
      f.solarPosition === "LESTE"
        ? "Face leste, com sol da manhã."
        : f.solarPosition === "NORTE"
          ? "Face norte, bem iluminado ao longo do dia."
          : null,
  ],
  [
    (f) =>
      f.amenities.lazer.length
        ? `Lazer e área externa: ${listPt(f.amenities.lazer)}.`
        : null,
    (f) =>
      f.amenities.seguranca.length
        ? `Segurança: ${listPt(f.amenities.seguranca)}.`
        : null,
    (f) =>
      f.amenities.conforto.length
        ? `Conforto e extras: ${listPt(f.amenities.conforto)}.`
        : null,
    (f) => (f.acceptsPets ? "Aceita animais de estimação." : null),
  ],
  [
    (f) => {
      const price = priceText(f);
      return price ? `Valores: ${price}.` : null;
    },
    (f) =>
      f.condoFee ? `Condomínio de ${formatBRL(f.condoFee)} por mês.` : null,
    (f) =>
      f.iptuValue
        ? `IPTU de ${formatBRL(f.iptuValue)} ${f.iptuPeriod === "MENSAL" ? "por mês" : "por ano"}.`
        : null,
    (f) => {
      const conds: string[] = [];
      if (f.acceptsFinancing) conds.push("financiamento");
      if (f.acceptsFgts) conds.push("FGTS");
      if (f.acceptsTrade) conds.push("permuta");
      return conds.length ? `Aceita ${listPt(conds)}.` : null;
    },
    (f) => (f.priceOnRequest ? "Valores sob consulta." : null),
  ],
  [
    (f, rng) =>
      rng.pick([
        `Agende sua visita com a FC Imóveis e conheça pessoalmente. Referência ${f.refCode}.`,
        `Entre em contato com a FC Imóveis para mais informações e visitas — referência ${f.refCode}.`,
        `Fale com a nossa equipe e marque uma visita. Código do imóvel: ${f.refCode}.`,
      ]),
  ],
];

/* ----------------------------- estilo EMOCIONAL ---------------------------- */

function emotionalOpening(f: DescriptionFacts, rng: Rng): string {
  const country = ["CHACARA", "SITIO", "FAZENDA"].includes(f.typeToken);
  const apartment = ["APARTAMENTO", "COBERTURA", "KITNET"].includes(f.typeToken);
  if (country) {
    return rng.pick([
      `Imagine trocar a correria da cidade pelo canto dos pássaros: é essa a sensação desta ${f.typeLabel.toLowerCase()} ${placeText(f)}.`,
      `Tem lugar melhor para recarregar as energias? Esta ${f.typeLabel.toLowerCase()} ${placeText(f)} é o refúgio que a sua família procura.`,
    ]);
  }
  if (apartment) {
    return rng.pick([
      `Imagine começar o dia com praticidade e conforto neste ${f.typeLabel.toLowerCase()} ${placeText(f)}.`,
      `Um ${f.typeLabel.toLowerCase()} pensado para o seu dia a dia, ${placeText(f)}.`,
      `Aqui, cada detalhe convida a ficar: ${f.typeLabel.toLowerCase()} ${placeText(f)}.`,
    ]);
  }
  return rng.pick([
    `Imagine a sua família crescendo nesta ${f.typeLabel.toLowerCase()} ${placeText(f)}.`,
    `Tem casa que a gente entra e já se sente em casa — é o caso desta ${f.typeLabel.toLowerCase()} ${placeText(f)}.`,
    `Um lar de verdade: ${f.typeLabel.toLowerCase()} ${placeText(f)}, pronta para novas histórias.`,
  ]);
}

const sceneByAmenity: Record<string, string[]> = {
  Piscina: [
    "dias quentes pedem um mergulho na piscina",
    "a piscina garante a diversão nos fins de semana",
  ],
  Churrasqueira: [
    "a churrasqueira é o ponto de encontro da família aos domingos",
    "churrasco com os amigos tem lugar garantido",
  ],
  "Área gourmet": [
    "a área gourmet recebe os almoços de domingo com estilo",
    "jantares especiais acontecem na área gourmet",
  ],
  Quintal: [
    "o quintal é espaço de sobra para as crianças e os pets",
    "um quintal de verdade, para viver ao ar livre",
  ],
  Jardim: ["o jardim traz verde e tranquilidade para a rotina"],
  "Varanda / Sacada": [
    "a varanda é perfeita para o café da manhã com calma",
    "fim de tarde bom é na varanda",
  ],
  Lareira: ["nas noites frias de Bragança, a lareira aquece a casa"],
  "Escritório / Home office": [
    "o escritório acomoda o home office com conforto",
  ],
};

const emocional: StyleTemplate = [
  [(f, rng) => emotionalOpening(f, rng)],
  [
    (f) => {
      const rooms = roomsText(f);
      if (!rooms) return null;
      return `O espaço acomoda bem: ${rooms}${f.usableArea ? `, em ${formatArea(f.usableArea)} muito bem aproveitados` : ""}.`;
    },
    (f, rng) => {
      const all = allAmenities(f);
      const scenes: string[] = [];
      for (const label of all) {
        const pool = sceneByAmenity[label];
        if (pool) scenes.push(rng.pick(pool));
      }
      const chosen = rng.sampleOrdered(scenes, 3);
      if (chosen.length === 0) return null;
      const text = chosen.join("; ");
      return text.charAt(0).toUpperCase() + text.slice(1) + ".";
    },
    (f) => {
      const rest = [...f.amenities.seguranca];
      if (rest.length === 0) return null;
      return `E para o sossego de quem você ama: ${listPt(rest)}.`;
    },
    (f) =>
      f.acceptsPets ? "Os pets também são bem-vindos por aqui." : null,
  ],
  [
    (f, rng) =>
      rng.pick([
        `${f.city} tem aquele ritmo de interior que faz bem: ar puro, gente conhecida e qualidade de vida${f.neighborhood ? ` — e o ${f.neighborhood} é um dos cantos mais queridos da cidade` : ""}.`,
        `Morar em ${f.city} é escolher viver melhor${f.neighborhood ? `, e o bairro ${f.neighborhood} traduz isso no dia a dia` : ""}.`,
      ]),
  ],
  [
    (f, rng) =>
      rng.pick([
        `Venha sentir isso de perto: agende uma visita com a FC Imóveis (ref. ${f.refCode}).`,
        `Que tal conhecer pessoalmente? A equipe da FC Imóveis adoraria te mostrar — referência ${f.refCode}.`,
      ]),
  ],
];

/* ---------------------------- estilo INVESTIDOR ---------------------------- */

const investidor: StyleTemplate = [
  [
    (f, rng) =>
      f.exclusive
        ? rng.pick([
            `Oportunidade com EXCLUSIVIDADE FC Imóveis: ${f.typeLabel.toLowerCase()} ${actionText(f)} ${placeText(f)}.`,
            `Só aqui: ${f.typeLabel.toLowerCase()} ${actionText(f)} ${placeText(f)}, com exclusividade da FC Imóveis.`,
          ])
        : rng.pick([
            `Oportunidade real de negócio: ${f.typeLabel.toLowerCase()} ${actionText(f)} ${placeText(f)}.`,
            `Para quem olha além do imóvel e enxerga o ativo: ${f.typeLabel.toLowerCase()} ${actionText(f)} ${placeText(f)}.`,
          ]),
  ],
  [
    (f) => {
      const area = areaText(f);
      const rooms = roomsText(f);
      if (area && rooms) return `Números que importam: ${area}, ${rooms}.`;
      if (area) return `Números que importam: ${area}.`;
      if (rooms) return `Configuração: ${rooms}.`;
      return null;
    },
    (f) =>
      f.pricePerM2
        ? `Isso representa cerca de ${formatBRL(f.pricePerM2)} por m² — compare com a região.`
        : null,
    (f) => {
      const price = priceText(f);
      return price ? `Valor: ${price}.` : null;
    },
    (f) => (f.priceOnRequest ? "Condições e valores sob consulta." : null),
  ],
  [
    (f) => {
      const liq: string[] = [];
      if (f.acceptsFinancing) liq.push("aceita financiamento");
      if (f.acceptsFgts) liq.push("aceita FGTS");
      if (f.acceptsTrade) liq.push("estuda permuta");
      if (liq.length === 0) return null;
      return `Flexibilidade na negociação: ${listPt(liq)} — o que amplia o leque de compradores na revenda.`;
    },
    (f) =>
      f.forRent && f.rentPrice
        ? `Potencial de renda imediata com a locação (${formatBRL(f.rentPrice)}/mês).`
        : f.forSeason && f.seasonDailyPrice
          ? `Potencial de renda com temporada (diária de ${formatBRL(f.seasonDailyPrice)}).`
          : null,
    (f) =>
      f.amenities.seguranca.length || f.condoName
        ? `Atributos que seguram valor de revenda: ${listPt([...(f.condoName ? ["condomínio consolidado"] : []), ...f.amenities.seguranca])}.`
        : null,
  ],
  [
    (f, rng) =>
      rng.pick([
        `${f.city} segue em valorização constante, puxada pela proximidade com a capital e pela qualidade de vida${f.neighborhood ? ` — e o ${f.neighborhood} acompanha esse movimento` : ""}.`,
        `Imóvel em ${f.city} é reserva de valor: a cidade cresce sem perder o perfil de interior${f.neighborhood ? `, e o ${f.neighborhood} está nesse mapa` : ""}.`,
      ]),
  ],
  [
    (f, rng) =>
      rng.pick([
        `Analise os números com a nossa equipe: FC Imóveis, referência ${f.refCode}.`,
        `Quer ver a conta fechar? Fale com a FC Imóveis — referência ${f.refCode}.`,
      ]),
  ],
];

/* --------------------------------- composição ------------------------------ */

function compose(template: StyleTemplate, f: DescriptionFacts, rng: Rng): string {
  const paragraphs: string[] = [];
  for (const slots of template) {
    const sentences = slots
      .map((slot) => slot(f, rng))
      .filter((s): s is string => Boolean(s));
    if (sentences.length > 0) paragraphs.push(sentences.join(" "));
  }
  return paragraphs.join("\n\n");
}

export type GeneratedDescriptions = {
  objetiva: string;
  emocional: string;
  investidor: string;
};

export function generateFromTemplates(
  facts: DescriptionFacts,
  seedId: string,
  regen: number,
): GeneratedDescriptions {
  return {
    objetiva: compose(objetiva, facts, createRng(`${seedId}:OBJETIVA:${regen}`)),
    emocional: compose(emocional, facts, createRng(`${seedId}:EMOCIONAL:${regen}`)),
    investidor: compose(
      investidor,
      facts,
      createRng(`${seedId}:INVESTIDOR:${regen}`),
    ),
  };
}
