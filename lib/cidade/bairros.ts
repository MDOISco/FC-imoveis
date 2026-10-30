// Bairros de Bragança Paulista — lista consolidada do relatório de out/2026
// (Portal de Imóveis Bragança, Líder Prime, CNES e INEP), já saneada:
// grafias variantes viram "apelidos" do mesmo bairro e ficaram de fora os
// municípios vizinhos (Vargem, Tuiuti, Atibaia…) e os nomes sem confirmação
// ("Jardins", "Brasil"). Os agrupamentos por região são INDICATIVOS (a
// Prefeitura não tem divisão oficial por zonas).
//
// Usada no cadastro (sugestões e grafia única) e na busca do site ("Onde?").
// Condomínio não é bairro: ficam em lib/cidade/condominios.ts.
import { chaveNome } from "./nomes";

export type Bairro = { nome: string; regiao: string; apelidos?: string[] };

type Entrada = string | [nome: string, apelidos: string[]];

const REGIOES: { regiao: string; bairros: Entrada[] }[] = [
  {
    regiao: "Centro e arredores",
    bairros: [
      "Centro",
      "Lavapés",
      "Matadouro",
      "Vila Municipal",
      ["Vila Mota", ["Vila Motta"]],
      ["Vila Aparecida", ["Aparecida"]],
      ["Vila Santa Libânia", ["Vila Santa Líbana", "Santa Libânia"]],
      "Santa Luzia",
      "Santa Terezinha",
      ["Jardim Santa Rita de Cássia", ["Santa Rita de Cássia"]],
      "Jardim Comendador Cardoso",
      "Vila Bianchi",
      "Jardim Recreio",
      "Vila Gesuato",
      "Vila São Caetano",
      "Vila Garcia",
      "Vila Flora",
      "Vila Maria",
      "Vila Batista",
      "Vila Bernadete",
      "Vila Edna",
      "Vila Esperança",
      "Vila Malva",
      "Vila Gato",
      "Vila Santa Cristina",
      "Vila São Francisco",
      ["Jardim Doutor Júlio de Mesquita Filho", ["Jardim Júlio de Mesquita Filho", "Júlio de Mesquita", "Jd. Dr. Júlio de Mesquita Filho"]],
      "Jardim Anchieta",
      "Jardim Novo Mundo",
      "Jardim Morumbi",
    ],
  },
  {
    regiao: "Taboão, Lago e Cidade Universitária",
    bairros: [
      "Taboão",
      "Lago do Taboão",
      "Jardim do Lago",
      "Jardim São José",
      "Cidade Universitária",
      ["Residencial Euroville", ["Euroville"]],
      "Jardim Nova Bragança",
      "Jardim Europa",
      "Jardim Sevilha",
      "Jardim Águas Claras",
      "Jardim Água Clara",
      ["Jardim Aracati", ["Jardim Aracaty"]],
      ["Jardim Araguari", ["Jardim Araguary"]],
      "Cidade Jardim",
      "Jardim Iguatemi",
      "Jardim do Cedro",
      "Jardim Primavera",
      "Jardim Paulista",
    ],
  },
  {
    regiao: "Santa Helena (sul)",
    bairros: [
      "Jardim Santa Helena",
      "Lagos de Santa Helena",
      "Residencial Santa Helena I",
      "Residencial Santa Helena II",
      "Residencial Santa Helena III",
      "Pinheiral de Santa Helena",
      "Jardim Lago do Moinho",
      "Tanque do Moinho",
      "Bosques da Pedra",
      "Jardim do Sul",
      "Jardim Lago do Sul",
    ],
  },
  {
    regiao: "Jardim América (oeste)",
    bairros: [
      ["Jardim América", ["Jardim América I", "Jardim América II", "Jardim América III"]],
      "Jardim Nova América",
      ["Jardim São Lourenço", ["São Lourenço"]],
      ["Jardim da Fraternidade", ["Jardim Fraternidade"]],
      "Jardim Vista Alegre",
      "Jardim Bela Vista",
      "Jardim Recanto Alegre",
      "Jardim Flamboyan",
      "Jardim Carlota",
      "Jardim Maria Augusta",
      "Jardim Califórnia",
      "Jardim Esmeralda",
      "Jardim das Laranjeiras",
      "Jardim Paturi",
      "Jardim Solar",
      "Jardim Santa Lúcia",
      "Jardim Santa Paulina",
      "Jardim Estância Santana",
    ],
  },
  {
    regiao: "Zona norte",
    bairros: [
      "Cidade Planejada I",
      "Cidade Planejada II",
      "Cidade Planejada III",
      "Parque dos Estados",
      "Parque Brasil",
      ["Vila Davi", ["Vila David"]],
      "Jardim Bonança",
      ["Núcleo Habitacional Padre Aldo Bolini", ["Padre Aldo Bolini", "Núcleo Habitacional Padre Aldo Boline"]],
      ["Núcleo Residencial Henedina Rodrigues Cortez", ["Henedina Cortez", "Henedina Rodrigues Cortez"]],
      ["Conjunto Habitacional Saada Nader Abi Chedid", ["CDHU", "Saada Nader Abi Chedid"]],
      "Conjunto Habitacional Francisco Sabella",
      "Conjunto Habitacional Nova Cidade",
      "Conjunto Habitacional Bragança Paulista F",
      ["Residencial Hípica Jaguari", ["Hípica Jaguari"]],
      "Recanto Maranata",
      "Toró",
      "Torozinho",
      ["Uberaba", ["Bairro do Uberaba", "Jardim Uberaba"]],
      "Jardim São Cristóvão",
      "Parque Caetê",
      "Parque das Faculdades",
      "Parque Residencial Rosa do Sul",
      "Jardim Santa Rita",
      "Jardim São Caetano",
    ],
  },
  {
    regiao: "Penha e São Miguel (leste)",
    bairros: [
      "Penha",
      ["Jardim São Miguel", ["São Miguel"]],
      "Jardim Recanto Elizabeth",
      "Portal São Marcelo",
      "Russolândia",
      ["Villa Real de Bragança", ["Vila Real de Bragança"]],
      ["Jardim das Paineiras", ["Paineiras de Bragança"]],
    ],
  },
  {
    regiao: "Distritos industriais",
    bairros: [
      ["Distrito Industrial Rafael Diniz", ["Centro Industrial", "Distrito Industrial"]],
      "Distrito Industrial II",
      "Distrito Industrial IV",
    ],
  },
  {
    regiao: "Campo Novo e Rod. Alkindar",
    bairros: [
      "Campo Novo",
      "Itapechinga",
      "Green Park",
      "Altos de Bragança",
      "Estância Bragança",
      ["Recanto Amapola", ["Jardim Amapola"]],
      "Quintas de Bragança",
      "Quinta do Barão",
    ],
  },
  {
    regiao: "Chácaras",
    bairros: [
      ["Chácaras Alvorada", ["Chácara Alvorada"]],
      ["Chácaras Fernão Dias", ["Chácara Fernão Dias", "Chácara Fernão Dias I", "Chácara Fernão Dias II"]],
      "Chácara Julieta Cristina",
      "Chácara Portal das Estâncias",
      "Chácaras Luzia Vicente",
      ["Chácaras Santo André", ["Jardim Santo André"]],
      "Chácaras São Conrado",
      ["Recanto dos Ipês", ["Chácara dos Ipês", "Recanto dos Ipês 3"]],
      "Recanto Suíço",
      "Recanto Vitória",
      "Recanto Jaguari 2",
      "Vale Encantado",
      "Colinas das Pedras",
      "Morro Verde",
      "Serra de Bragança",
      "Aeródromo Vale Eldorado",
    ],
  },
  {
    regiao: "Zona rural",
    bairros: [
      ["Araras dos Mori", ["Arara dos Mori"]],
      ["Araras dos Pereiras", ["Arara dos Pereiras"]],
      "Araras dos Bandeiras",
      "Mãe dos Homens",
      "Bairro do Menin",
      ["Água Comprida", ["Água Cumprida"]],
      "Curitibanos",
      ["Biriçá do Valado", ["Biricá do Valado"]],
      ["Biriçá do Campinho", ["Biricá do Campinho"]],
      ["Biriçá", ["Biricá"]],
      "Morro Grande da Boa Vista",
      "Morro Grande do Anhumas",
      "Anhumas",
      "Boa Vista",
      "Boa Vista dos Silva",
      "Guaripocaba",
      "Guaripocaba dos Souzas",
      "Guaripocaba da Estação",
      "Agudo",
      "Agudo dos Frias",
      "Estiva do Agudo",
      "Bairro dos Frias",
      ["Atibaianos", ["Ponte do Atibaianos"]],
      "Bairro da Usina",
      "Bairro das Formigas",
      "Bairro dos Coutos",
      "Bom Retiro",
      "Bom Retiro dos Bacci",
      "Bom Retiro dos Mourão",
      "Caieira",
      "Canivete",
      "Capela do Barreiro",
      "Cruzeiro",
      "Guaraiúva",
      "Maciel",
      "Morro do Sabão",
      "Passa Três",
      "Pinheiral",
      "Ponte Alta",
      "Popó",
      "Rio Abaixo",
      "Santa Amélia",
      "Serrinha",
      "Sete Barras",
      "Sete Lagos",
      "Sete Pontes",
      ["Bairro da Marina", ["Represa", "Marina"]],
    ],
  },
];

export const BAIRROS: Bairro[] = REGIOES.flatMap(({ regiao, bairros }) =>
  bairros.map((b) =>
    typeof b === "string" ? { nome: b, regiao } : { nome: b[0], regiao, apelidos: b[1] },
  ),
);

/** Regiões na ordem da lista (para agrupar na tela). */
export const REGIOES_BAIRROS: string[] = REGIOES.map((r) => r.regiao);

const POR_CHAVE = new Map<string, Bairro>();
for (const b of BAIRROS) {
  for (const n of [b.nome, ...(b.apelidos ?? [])]) {
    const k = chaveNome(n);
    if (k && !POR_CHAVE.has(k)) POR_CHAVE.set(k, b);
  }
}

/** Bairro da lista com esse nome (aceita as outras grafias). */
export function bairroPorNome(nome: string | null | undefined): Bairro | null {
  if (!nome?.trim()) return null;
  return POR_CHAVE.get(chaveNome(nome)) ?? null;
}

/** Nomes oficiais em ordem alfabética. */
export const NOMES_BAIRROS: string[] = BAIRROS.map((b) => b.nome).sort((a, b) =>
  a.localeCompare(b, "pt-BR"),
);
