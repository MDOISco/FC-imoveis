// Núcleo de domínio: tokens persistidos no banco (em pt-BR, estáveis) e seus
// labels de interface. SQLite não tem enums — este arquivo é a fonte única.

export type Option = { value: string; label: string };

function toMap(options: Option[]): Record<string, string> {
  return Object.fromEntries(options.map((o) => [o.value, o.label]));
}

export function labelOf(options: Option[], value: string | null | undefined): string {
  if (!value) return "—";
  return toMap(options)[value] ?? value;
}

/* ============================= Status ============================= */

export const PROPERTY_STATUSES: Option[] = [
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "EM_APROVACAO", label: "Aguardando aprovação" },
  { value: "ATIVO", label: "Ativo" },
  { value: "RESERVADO", label: "Reservado" },
  { value: "VENDIDO", label: "Vendido" },
  { value: "ALUGADO", label: "Alugado" },
  { value: "DESATIVADO", label: "Desativado" },
  { value: "REPROVADO", label: "Reprovado" },
];
export const STATUS_LABELS = toMap(PROPERTY_STATUSES);

// Classes completas (Tailwind v4 não enxerga classes montadas dinamicamente)
export const STATUS_BADGE_CLASSES: Record<string, string> = {
  RASCUNHO: "border border-stone-300 bg-white text-stone-800",
  EM_APROVACAO: "bg-gold-100 text-gold-900",
  ATIVO: "bg-brand-100 text-brand-900",
  RESERVADO: "bg-blue-100 text-blue-900",
  VENDIDO: "bg-purple-100 text-purple-900",
  ALUGADO: "bg-indigo-100 text-indigo-900",
  DESATIVADO: "bg-stone-300 text-stone-700",
  REPROVADO: "bg-red-100 text-red-900",
};

/* ============================ Finalidade ========================== */

// A FC não trabalha com temporada; no lugar, a finalidade "Permuta" (que na
// prática é VENDA + tag de permuta — a tradução acontece na etapa 1 do wizard).
export const PURPOSES: Option[] = [
  { value: "VENDA", label: "Venda" },
  { value: "LOCACAO", label: "Locação" },
  { value: "VENDA_LOCACAO", label: "Venda e Locação" },
  { value: "PERMUTA", label: "♻️ Permuta" },
];
export const PURPOSE_LABELS: Record<string, string> = {
  ...toMap(PURPOSES),
  TEMPORADA: "Temporada", // legado: nenhum imóvel novo usa
};

export function purposeIncludesSale(purpose?: string | null) {
  return purpose === "VENDA" || purpose === "VENDA_LOCACAO";
}
export function purposeIncludesRent(purpose?: string | null) {
  return purpose === "LOCACAO" || purpose === "VENDA_LOCACAO";
}
export function purposeIsSeason(purpose?: string | null) {
  return purpose === "TEMPORADA";
}

/* ========================== Tipo de imóvel ======================== */

export const PROPERTY_TYPES: Option[] = [
  { value: "CASA", label: "Casa" },
  { value: "CASA_CONDOMINIO", label: "Casa em condomínio" },
  { value: "SOBRADO", label: "Sobrado" },
  { value: "APARTAMENTO", label: "Apartamento" },
  { value: "COBERTURA", label: "Cobertura" },
  { value: "KITNET", label: "Kitnet / Studio" },
  { value: "CHACARA", label: "Chácara" },
  { value: "SITIO", label: "Sítio" },
  { value: "FAZENDA", label: "Fazenda" },
  { value: "TERRENO", label: "Terreno" },
  { value: "TERRENO_CONDOMINIO", label: "Terreno em condomínio" },
  { value: "GALPAO", label: "Galpão" },
  { value: "SALA_COMERCIAL", label: "Sala comercial" },
  { value: "LOJA", label: "Loja / Ponto comercial" },
  { value: "PREDIO_COMERCIAL", label: "Prédio comercial" },
  { value: "AREA_LOTE", label: "Área / Lote" },
];
export const PROPERTY_TYPE_LABELS = toMap(PROPERTY_TYPES);

// Tipos em que faz sentido falar de andar / elevador
export const APARTMENT_LIKE_TYPES = ["APARTAMENTO", "COBERTURA", "KITNET"];
// Tipos sem construção (esconder quartos/banheiros no wizard)
export const LAND_TYPES = ["TERRENO", "TERRENO_CONDOMINIO", "AREA_LOTE"];

/* =========================== Características ====================== */

export const FURNISHED_OPTIONS: Option[] = [
  { value: "NAO", label: "Não mobiliado" },
  { value: "SEMI", label: "Semimobiliado" },
  { value: "SIM", label: "Mobiliado" },
];

export const SOLAR_POSITIONS: Option[] = [
  { value: "NORTE", label: "Norte" },
  { value: "SUL", label: "Sul" },
  { value: "LESTE", label: "Leste (sol da manhã)" },
  { value: "OESTE", label: "Oeste (sol da tarde)" },
];

export const ADDRESS_VISIBILITY_OPTIONS: Option[] = [
  { value: "BAIRRO", label: "Mostrar só cidade e bairro (padrão da imobiliária)" },
  { value: "COMPLETO", label: "Mostrar endereço completo" },
  { value: "OCULTO", label: "Não mostrar nem o bairro (só a cidade)" },
];

export const IPTU_PERIODS: Option[] = [
  { value: "ANUAL", label: "por ano" },
  { value: "MENSAL", label: "por mês" },
];

export const DOCS_STATUS_OPTIONS: Option[] = [
  { value: "REGULAR", label: "Documentação regular" },
  { value: "PENDENTE", label: "Documentação pendente" },
  { value: "EM_REGULARIZACAO", label: "Em regularização" },
];

/* ============================ Descrições ========================== */

export const DESCRIPTION_STYLES: Option[] = [
  { value: "OBJETIVA", label: "Objetiva e completa" },
  { value: "EMOCIONAL", label: "Acolhedora" },
  { value: "INVESTIDOR", label: "Para investidor" },
];

/* ============================= Portais ============================ */

export const PORTALS: Option[] = [
  { value: "ZAP", label: "ZAP Imóveis" },
  { value: "VIVAREAL", label: "VivaReal" },
  { value: "OLX", label: "OLX Imóveis" },
  { value: "CHAVES_NA_MAO", label: "Chaves na Mão" },
  { value: "IMOVELWEB", label: "Imovelweb" },
];
export const PORTAL_LABELS = toMap(PORTALS);

export type PortalFeedDef = {
  key: string; // chave do FeedAccess
  path: string; // caminho da rota do feed
  label: string;
  portals: string[]; // quais portais este feed cobre
  instructions: string[];
};

export const PORTAL_FEEDS: PortalFeedDef[] = [
  {
    key: "CANALPRO",
    path: "/api/feeds/canalpro.xml",
    label: "Canal Pro (ZAP Imóveis + VivaReal + OLX)",
    portals: ["ZAP", "VIVAREAL", "OLX"],
    instructions: [
      "Acesse o Canal Pro (canalpro.grupozap.com) com a conta da imobiliária.",
      "Vá em Integrações → Carga automática (XML).",
      "Cole a URL do feed acima e salve.",
      "O portal passa a sincronizar sozinho os imóveis ativos, em geral a cada poucas horas.",
    ],
  },
  {
    key: "CHAVES_NA_MAO",
    path: "/api/feeds/chavesnamao.xml",
    label: "Chaves na Mão",
    portals: ["CHAVES_NA_MAO"],
    instructions: [
      "Entre em contato com o suporte do Chaves na Mão ou acesse o painel do anunciante.",
      "Solicite integração por carga XML (formato VRSync/Grupo ZAP).",
      "Informe a URL do feed acima.",
    ],
  },
  {
    key: "IMOVELWEB",
    path: "/api/feeds/imovelweb.xml",
    label: "Imovelweb",
    portals: ["IMOVELWEB"],
    instructions: [
      "No painel do Imovelweb, solicite integração por carga XML.",
      "Informe a URL do feed acima ao time de integrações.",
    ],
  },
];

/* =========================== Comodidades ========================== */

export type Amenity = {
  key: string;
  label: string;
  category: "LAZER" | "SEGURANCA" | "CONFORTO";
  vrsyncFeature?: string; // token do feed; sem token = não vai ao portal
};

export const AMENITY_CATEGORIES: Option[] = [
  { value: "LAZER", label: "Lazer e área externa" },
  { value: "SEGURANCA", label: "Segurança" },
  { value: "CONFORTO", label: "Conforto e extras" },
];

export const AMENITIES: Amenity[] = [
  // Lazer e área externa
  { key: "piscina", label: "Piscina", category: "LAZER", vrsyncFeature: "Pool" },
  { key: "churrasqueira", label: "Churrasqueira", category: "LAZER", vrsyncFeature: "BBQ" },
  { key: "area-gourmet", label: "Área gourmet", category: "LAZER", vrsyncFeature: "Gourmet Area" },
  { key: "quintal", label: "Quintal", category: "LAZER", vrsyncFeature: "Backyard" },
  { key: "jardim", label: "Jardim", category: "LAZER", vrsyncFeature: "Garden" },
  { key: "varanda", label: "Varanda / Sacada", category: "LAZER", vrsyncFeature: "Balcony" },
  { key: "quadra", label: "Quadra esportiva", category: "LAZER", vrsyncFeature: "Sports Court" },
  { key: "playground", label: "Playground", category: "LAZER", vrsyncFeature: "Playground" },
  { key: "salao-festas", label: "Salão de festas", category: "LAZER", vrsyncFeature: "Party Room" },
  { key: "academia", label: "Academia", category: "LAZER", vrsyncFeature: "Gym" },
  // Segurança
  { key: "portaria-24h", label: "Portaria 24h", category: "SEGURANCA", vrsyncFeature: "Security Guard on Duty" },
  { key: "condominio-fechado", label: "Condomínio fechado", category: "SEGURANCA", vrsyncFeature: "Gated Community" },
  { key: "portao-eletronico", label: "Portão eletrônico", category: "SEGURANCA", vrsyncFeature: "Electronic Gate" },
  { key: "alarme", label: "Alarme", category: "SEGURANCA", vrsyncFeature: "Alarm System" },
  { key: "cameras", label: "Câmeras de segurança", category: "SEGURANCA", vrsyncFeature: "Security Cameras" },
  { key: "cerca-eletrica", label: "Cerca elétrica", category: "SEGURANCA" },
  { key: "interfone", label: "Interfone", category: "SEGURANCA", vrsyncFeature: "Intercom" },
  // Conforto e extras
  { key: "ar-condicionado", label: "Ar-condicionado", category: "CONFORTO", vrsyncFeature: "Air Conditioning" },
  { key: "aquecimento-solar", label: "Aquecimento solar", category: "CONFORTO", vrsyncFeature: "Solar Heating" },
  { key: "energia-solar", label: "Energia solar", category: "CONFORTO" },
  { key: "lareira", label: "Lareira", category: "CONFORTO", vrsyncFeature: "Fireplace" },
  { key: "escritorio", label: "Escritório / Home office", category: "CONFORTO", vrsyncFeature: "Home Office" },
  { key: "lavanderia", label: "Lavanderia", category: "CONFORTO", vrsyncFeature: "Laundry Room" },
  { key: "despensa", label: "Despensa", category: "CONFORTO", vrsyncFeature: "Pantry" },
  { key: "closet", label: "Closet", category: "CONFORTO", vrsyncFeature: "Walk-in Closet" },
  { key: "cozinha-planejada", label: "Cozinha planejada", category: "CONFORTO", vrsyncFeature: "Fitted Kitchen" },
  { key: "moveis-planejados", label: "Móveis planejados", category: "CONFORTO" },
  { key: "poco-artesiano", label: "Poço artesiano", category: "CONFORTO" },
  { key: "elevador", label: "Elevador", category: "CONFORTO", vrsyncFeature: "Elevator" },
  { key: "acessibilidade", label: "Acessibilidade", category: "CONFORTO", vrsyncFeature: "Disabled Access" },
];

export const AMENITY_BY_KEY: Record<string, Amenity> = Object.fromEntries(
  AMENITIES.map((a) => [a.key, a]),
);

export function amenityLabels(keys: string[]): string[] {
  return keys.map((k) => AMENITY_BY_KEY[k]?.label).filter(Boolean) as string[];
}

export function parseAmenities(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/* ============================= Permutas =========================== */

export const PROPERTY_SOURCES: Option[] = [
  { value: "CORRETOR", label: "Carteira da imobiliária" },
  { value: "LEAD", label: "Cliente (permuta)" },
];

export const CASH_TOPUP_OPTIONS: Option[] = [
  { value: "PODE_PAGAR", label: "Posso pagar uma diferença em dinheiro" },
  { value: "QUER_RECEBER", label: "Quero receber uma diferença em dinheiro" },
  { value: "INDIFERENTE", label: "Tanto faz / a combinar" },
];

export const MATCH_STATUSES: Option[] = [
  { value: "NOVO", label: "Novo" },
  { value: "EM_ATENDIMENTO", label: "Em atendimento" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "CANCELADO", label: "Cancelado" },
];
export const MATCH_STATUS_BADGE_CLASSES: Record<string, string> = {
  NOVO: "bg-gold-100 text-gold-900",
  EM_ATENDIMENTO: "bg-blue-100 text-blue-900",
  CONCLUIDO: "bg-brand-100 text-brand-900",
  CANCELADO: "bg-stone-200 text-stone-700",
};

export const ADDRESS_REQUEST_STATUSES: Option[] = [
  { value: "NOVO", label: "Novo" },
  { value: "CONTATADO", label: "Contatado" },
];

/* ================= Cadastro do cliente (objetivo) ================= */

// O que o cliente quer fazer com o imóvel dele no cadastro público.
// Mapeamento no banco: PERMUTAR -> purpose=VENDA + acceptsTrade=true;
// VENDER -> purpose=VENDA; ALUGAR -> purpose=LOCACAO (acceptsTrade=false).
export const LEAD_OBJETIVO_OPTIONS: Array<Option & { help: string }> = [
  {
    value: "PERMUTAR",
    label: "♻️ Trocar (permuta)",
    help: "Seu imóvel entra na página de permutas e você explora as trocas possíveis.",
  },
  {
    value: "VENDER",
    label: "🏷️ Vender",
    help: "Nossa equipe avalia seu imóvel e entra em contato para anunciar a venda.",
  },
  {
    value: "ALUGAR",
    label: "🔑 Alugar",
    help: "Nossa equipe avalia seu imóvel e entra em contato para anunciar a locação.",
  },
];

export function objetivoDoImovel(p: {
  purpose: string | null;
  acceptsTrade: boolean;
}): "PERMUTAR" | "VENDER" | "ALUGAR" {
  if (p.acceptsTrade) return "PERMUTAR";
  return p.purpose === "LOCACAO" ? "ALUGAR" : "VENDER";
}

export const LEAD_OBJETIVO_BADGE_CLASSES: Record<string, string> = {
  PERMUTAR: "bg-gold-100 text-gold-900",
  VENDER: "bg-brand-100 text-brand-900",
  ALUGAR: "bg-blue-100 text-blue-900",
};

/* ========================== Agendamentos ========================== */

export const APPOINTMENT_STATUSES: Option[] = [
  { value: "AGENDADO", label: "Agendada" },
  { value: "CONFIRMADO", label: "Confirmada" },
  { value: "CANCELADO", label: "Cancelada" },
  { value: "REALIZADO", label: "Realizada" },
];
export const APPOINTMENT_STATUS_BADGE_CLASSES: Record<string, string> = {
  AGENDADO: "bg-gold-100 text-gold-900",
  CONFIRMADO: "bg-brand-100 text-brand-900",
  CANCELADO: "bg-stone-200 text-stone-700",
  REALIZADO: "bg-blue-100 text-blue-900",
};

/* ============================ Ordenação =========================== */

export const SORT_OPTIONS: Option[] = [
  { value: "recentes", label: "Mais recentes" },
  { value: "antigos", label: "Mais antigos" },
  { value: "maior-preco", label: "Maior preço" },
  { value: "menor-preco", label: "Menor preço" },
];
