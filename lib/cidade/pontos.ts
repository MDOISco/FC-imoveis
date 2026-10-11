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
    id: "estadio-nabi",
    nome: "Estádio Nabi Abi Chedid",
    emoji: "⚽",
    categoria: "Esporte",
    lat: -22.9653902,
    lng: -46.5368855,
    curiosidade:
      "A casa do Red Bull Bragantino, o Massa Bruta! Em dia de jogo a cidade inteira vibra — e o estádio fica pertinho do centro, dá para ir caminhando do Lago do Taboão.",
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
    id: "parque-estados",
    nome: "Parque dos Estados",
    emoji: "🌳",
    categoria: "Natureza",
    lat: -22.9142911,
    lng: -46.5546636,
    curiosidade:
      "Área verde generosa para piquenique, esporte e brincadeira com as crianças. Bragança é Estância Climática desde 1964 — o clima ameno da Serra da Mantiqueira é um dos grandes motivos de tanta gente escolher viver aqui.",
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
    titulo: "Estância Climática desde 1964",
    texto:
      "Clima ameno da Serra da Mantiqueira o ano todo — reconhecimento oficial que poucas cidades paulistas têm.",
  },
  {
    emoji: "💚",
    titulo: "A Cidade Poesia",
    texto:
      "É assim, carinhosamente, que Bragança é conhecida — pelo jeito acolhedor, pelas praças floridas e pela vida boa de interior a só uma hora de São Paulo.",
  },
];
