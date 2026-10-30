// Categorias dos estabelecimentos de lib/cidade/estabelecimentos.ts — usadas
// no mapa "Onde fica cada coisa" (/cidade), no "O que tem perto" da página
// do imóvel, nas descrições geradas e no filtro "Perto de" da busca.
// A ordem desta lista é a ordem em que aparecem para o cliente.

export type CategoriaLugar =
  | "MERCADO"
  | "PADARIA"
  | "FARMACIA"
  | "HOSPITAL"
  | "POSTO_SAUDE"
  | "CLINICA"
  | "ESCOLA"
  | "CRECHE"
  | "FACULDADE"
  | "ACADEMIA"
  | "RESTAURANTE"
  | "COMPRAS"
  | "BANCO"
  | "POSTO";

export type Categoria = {
  value: CategoriaLugar;
  label: string; // plural, para títulos e botões ("Mercados e supermercados")
  curto: string; // singular curto, para frases ("supermercado")
  emoji: string;
  cor: string; // hex: borda do marcador no mapa (estilo inline do Leaflet)
  raio: number; // metros: até onde ainda conta como "perto" do imóvel
};

export const CATEGORIAS_LUGAR: Categoria[] = [
  { value: "MERCADO", label: "Mercados e supermercados", curto: "supermercado", emoji: "🛒", cor: "#15803d", raio: 2000 },
  { value: "PADARIA", label: "Padarias", curto: "padaria", emoji: "🥖", cor: "#b45309", raio: 2000 },
  { value: "FARMACIA", label: "Farmácias", curto: "farmácia", emoji: "💊", cor: "#be123c", raio: 2000 },
  { value: "HOSPITAL", label: "Hospitais e UPAs", curto: "hospital", emoji: "🏥", cor: "#dc2626", raio: 5000 },
  { value: "POSTO_SAUDE", label: "Postos de saúde (UBS)", curto: "posto de saúde", emoji: "🩺", cor: "#db2777", raio: 2000 },
  { value: "CLINICA", label: "Clínicas e laboratórios", curto: "clínica", emoji: "🔬", cor: "#7c3aed", raio: 3000 },
  { value: "ESCOLA", label: "Escolas", curto: "escola", emoji: "🏫", cor: "#2563eb", raio: 2000 },
  { value: "CRECHE", label: "Creches e educação infantil", curto: "creche", emoji: "🧸", cor: "#ca8a04", raio: 2000 },
  { value: "FACULDADE", label: "Faculdades e cursos técnicos", curto: "faculdade", emoji: "🎓", cor: "#4338ca", raio: 5000 },
  { value: "ACADEMIA", label: "Academias", curto: "academia", emoji: "🏋️", cor: "#0891b2", raio: 2000 },
  { value: "RESTAURANTE", label: "Restaurantes e pizzarias", curto: "restaurante", emoji: "🍽️", cor: "#c2410c", raio: 2000 },
  { value: "COMPRAS", label: "Shoppings e lojas", curto: "comércio", emoji: "🛍️", cor: "#9333ea", raio: 5000 },
  { value: "BANCO", label: "Bancos", curto: "banco", emoji: "🏦", cor: "#0f766e", raio: 3000 },
  { value: "POSTO", label: "Postos de combustível", curto: "posto de combustível", emoji: "⛽", cor: "#475569", raio: 3000 },
];

export const CATEGORIA_POR_VALOR: Record<CategoriaLugar, Categoria> =
  Object.fromEntries(CATEGORIAS_LUGAR.map((c) => [c.value, c])) as Record<
    CategoriaLugar,
    Categoria
  >;

export function ehCategoriaLugar(v: string): v is CategoriaLugar {
  return v in CATEGORIA_POR_VALOR;
}
