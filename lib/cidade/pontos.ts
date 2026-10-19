// Pontos turísticos de Bragança Paulista com coordenadas reais
// (geocodificadas no OpenStreetMap) e curiosidades positivas pesquisadas.

export type PontoTuristico = {
  id: string;
  nome: string;
  emoji: string;
  categoria: string;
  lat: number;
  lng: number;
  curiosidade: string;
};

export const CENTRO_BRAGANCA: [number, number] = [-22.9565, -46.542];

export const PONTOS_TURISTICOS: PontoTuristico[] = [
  {
    id: "lago-taboao",
    nome: "Lago do Taboão",
    emoji: "🌊",
    categoria: "Lazer",
    lat: -22.9729636,
    lng: -46.535214,
    curiosidade:
      "O coração do lazer bragantino: pista de caminhada à beira d'água, quiosques, pedalinhos e um pôr do sol que é programa garantido no fim de tarde. É um dos lugares mais amados e bem avaliados da cidade.",
  },
  {
    id: "novo-estadio-bragantino",
    nome: "Novo estádio do Red Bull Bragantino",
    emoji: "⚽",
    categoria: "Esporte",
    lat: -22.9508303,
    lng: -46.5270896,
    curiosidade:
      "A casa do Massa Bruta está de mudança: o antigo estádio Nabi Abi Chedid foi demolido e o clube constrói um novo estádio na região do Posto de Monta (Parque de Exposições Dr. Fernando Costa). Em dia de jogo, a cidade inteira vibra!",
  },
  {
    id: "catedral",
    nome: "Catedral Nossa Senhora da Conceição",
    emoji: "⛪",
    categoria: "História e fé",
    lat: -22.9564684,
    lng: -46.5419527,
    curiosidade:
      "A cidade nasceu aqui: em 15 de dezembro de 1763 ergueram uma capela a Nossa Senhora da Conceição, e o povoado se chamava Conceição do Jaguary — ponto de descanso dos tropeiros. A Catedral fica na Praça Raul Leme, bem no coração do centro.",
  },
  {
    id: "igreja-rosario",
    nome: "Igreja do Rosário",
    emoji: "🕯️",
    categoria: "História e fé",
    lat: -22.9525476,
    lng: -46.5421093,
    curiosidade:
      "Uma das igrejas mais queridas e antigas da cidade, na Praça Dom José Maurício. O conjunto do centro histórico guarda o charme da época em que a vila se chamava Nova Bragança (1797).",
  },
  {
    id: "museu-russomano",
    nome: "Museu Municipal Oswaldo Russomano",
    emoji: "🏛️",
    categoria: "Cultura",
    lat: -22.9545516,
    lng: -46.5412335,
    curiosidade:
      "Um casarão cheio de memória bragantina: móveis, fotos e objetos que contam mais de 260 anos de história da cidade — passeio rápido, gratuito e encantador.",
  },
  {
    id: "rua-coronel",
    nome: "Centro comercial — Rua Cel. Teófilo Leme",
    emoji: "🛍️",
    categoria: "Compras",
    lat: -22.9548777,
    lng: -46.5405351,
    curiosidade:
      "O famoso 'centrão' de Bragança: comércio forte e movimentado o ano inteiro. E atenção ao título oficial da cidade: Capital Nacional da Linguiça Artesanal — procure as casas de linguiça tradicionais e prove a iguaria que leva o nome de Bragança para o Brasil todo!",
  },
  {
    id: "jardim-publico",
    nome: "Jardim Público",
    emoji: "🌳",
    categoria: "Natureza",
    lat: -22.9635973,
    lng: -46.5391013,
    curiosidade:
      "O tradicional Jardim Público de Bragança (Parque Luiz Gonzaga da Silva Leme), pertinho do centro: árvores centenárias, sombra e espaço para caminhar e descansar. Bragança é Estância Climática desde 1964 — o clima ameno da Serra da Mantiqueira é um dos grandes motivos de tanta gente escolher viver aqui.",
  },
  {
    id: "braganca-shopping",
    nome: "Bragança Shopping",
    emoji: "🎬",
    categoria: "Lazer",
    lat: -22.9700507,
    lng: -46.5680453,
    curiosidade:
      "Cinema, lojas e praça de alimentação para completar o fim de semana. A cidade cresce com qualidade: a só ~1h da capital, tem estrutura completa sem abrir mão da vida tranquila do interior.",
  },
];

export const CURIOSIDADES_GERAIS: Array<{ emoji: string; titulo: string; texto: string }> = [
  {
    emoji: "🌭",
    titulo: "Capital Nacional da Linguiça Artesanal",
    texto:
      "Título oficial reconhecido pelo Congresso Nacional em 2018 — única cidade do país com essa honra. O Festival da Linguiça reúne dezenas de milhares de visitantes por edição!",
  },
  {
    emoji: "📜",
    titulo: "Mais de 260 anos de história",
    texto:
      "Fundada em 15 de dezembro de 1763 como Conceição do Jaguary, virou Nova Bragança em 1797 e Bragança Paulista em 1944.",
  },
  {
    emoji: "⛰️",
    titulo: "Circuito das Águas Paulista",
    texto:
      "Bragança faz parte do Circuito das Águas Paulista e é Estância Climática desde 1964 — clima ameno da Serra da Mantiqueira o ano todo.",
  },
  {
    emoji: "💚",
    titulo: "A Cidade Poesia",
    texto:
      "Bragança é chamada carinhosamente de \"Cidade Poesia\" principalmente porque foi construída sobre sete colinas, como Roma — cada uma abrigando uma paróquia ou um marco histórico. Some isso às praças floridas e à vida boa de interior a uma hora de São Paulo.",
  },
];
