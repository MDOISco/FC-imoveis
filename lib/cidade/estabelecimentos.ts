// Estabelecimentos de Bragança Paulista com coordenadas REAIS, para o mapa
// "Onde fica cada coisa" (/cidade) e o "O que tem perto" dos imóveis.
//
// Fontes (out/2026):
// - planilha da dona (Google Maps, 30/10/2026, 2ª versão): mercados,
//   hortifrútis, padarias, postos, academias, restaurantes, clínicas,
//   laboratórios, lojas e parte das escolas e creches;
// - relatório de out/2026 (endereços do CNES, Censo Escolar/INEP e sites
//   oficiais): hospitais, UPAs, postos de saúde, escolas, creches municipais,
//   faculdades, shoppings, farmácias e bancos — localizados no OpenStreetMap
//   e conferidos (nome e bairro/rua precisam bater; o que não bateu ficou de
//   fora).
// É uma AMOSTRA dos mais relevantes, não um inventário completo. Telefones
// ficaram de fora de propósito (mudam com frequência).
//
// Para acrescentar um lugar: copie uma linha, troque os dados e pegue a
// latitude/longitude no Google Maps (botão direito no ponto → coordenadas).
import type { CategoriaLugar } from "./categorias";

export type Estabelecimento = {
  id: string;
  nome: string;
  categoria: CategoriaLugar;
  tipo: string;
  endereco: string; // endereço do estabelecimento (é público)
  bairro: string;
  lat: number;
  lng: number;
  obs?: string;
};

export const ESTABELECIMENTOS: Estabelecimento[] = [
  // ---- MERCADO ----
  { id: "uniao-supermercados-loja-12-centro", nome: "União Supermercados (Loja 12)", categoria: "MERCADO", tipo: "Supermercado", endereco: "Av. José Gomes da Rocha Leal, 1151", bairro: "Centro", lat: -22.9566842, lng: -46.5450148 },
  { id: "unisuper-rede-uniao-matadouro", nome: "Unisuper (rede União)", categoria: "MERCADO", tipo: "Supermercado", endereco: "Av. Juscelino K. de Oliveira, 54", bairro: "Matadouro", lat: -22.9435558, lng: -46.539772 },
  { id: "unisuper-uniao-supermercados-loja-7-jardim-aguas", nome: "Unisuper União Supermercados (Loja 7)", categoria: "MERCADO", tipo: "Supermercado", endereco: "Av. Guido Duci, 123", bairro: "Jardim Águas Claras", lat: -22.92003, lng: -46.527413 },
  { id: "uniao-supermercados-braganca-17-parque-brasil", nome: "União Supermercados (Bragança 17)", categoria: "MERCADO", tipo: "Supermercado", endereco: "R. Padre João Pastrana, 178", bairro: "Parque Brasil", lat: -22.9378134, lng: -46.5530108 },
  { id: "sm-supermercados-mendonca-centro", nome: "SM Supermercados Mendonça", categoria: "MERCADO", tipo: "Supermercado", endereco: "Av. dos Imigrantes, 2120", bairro: "Centro", lat: -22.955059, lng: -46.5464874 },
  { id: "sm-supermercados-mendonca-cidade-planejada-i", nome: "SM Supermercados Mendonça", categoria: "MERCADO", tipo: "Supermercado", endereco: "Av. Dep. Virgílio de Carvalho Pinto, 601", bairro: "Cidade Planejada I", lat: -22.916002, lng: -46.554093 },
  { id: "da-praca-supermercado-centro", nome: "Da Praça Supermercado", categoria: "MERCADO", tipo: "Supermercado", endereco: "Av. dos Imigrantes, 2222", bairro: "Centro", lat: -22.9530212, lng: -46.5466382 },
  { id: "da-praca-supermercado-jardim-sao-jose", nome: "Da Praça Supermercado", categoria: "MERCADO", tipo: "Supermercado", endereco: "R. Dante Grimello, 73", bairro: "Jardim São José", lat: -22.9673138, lng: -46.5447693 },
  { id: "emporio-big-jardim-america", nome: "Empório Big", categoria: "MERCADO", tipo: "Supermercado", endereco: "Av. dos Imigrantes, 2400", bairro: "Jardim América", lat: -22.9521515, lng: -46.5465282 },
  { id: "convem-supermercados-santa-helena", nome: "Convém Supermercados", categoria: "MERCADO", tipo: "Supermercado premium", endereco: "Av. Salvador Markowicz, 339", bairro: "Santa Helena", lat: -22.9806103, lng: -46.5303313 },
  { id: "convem-supermercados-jd-america-jardim-sao-migue", nome: "Convém Supermercados – Jd. América", categoria: "MERCADO", tipo: "Supermercado premium", endereco: "Av. Dr. Plínio Salgado, 300", bairro: "Jardim São Miguel", lat: -22.9524388, lng: -46.5479578 },
  { id: "comercial-esperanca-jd-dr-julio-de-mesquita-filh", nome: "Comercial Esperança", categoria: "MERCADO", tipo: "Supermercado", endereco: "Al. Quinze de Dezembro, 100", bairro: "Jd. Dr. Júlio de Mesquita Filho", lat: -22.9489138, lng: -46.5282191 },
  { id: "spani-atacadista-jardim-nova-braganca", nome: "Spani Atacadista", categoria: "MERCADO", tipo: "Atacadista", endereco: "Av. Dom Pedro I, 1025", bairro: "Jardim Nova Bragança", lat: -22.974678, lng: -46.5300865 },
  { id: "spani-atacadista-lavapes", nome: "Spani Atacadista", categoria: "MERCADO", tipo: "Atacadista", endereco: "R. Monteiro Lobato, 120", bairro: "Lavapés", lat: -22.9470567, lng: -46.5448719 },
  { id: "petruso-petruso-supermercado-vila-santa-libania", nome: "Petruso & Petruso Supermercado", categoria: "MERCADO", tipo: "Supermercado", endereco: "R. Santa Cruz, 716", bairro: "Vila Santa Libânia", lat: -22.9447979, lng: -46.547397 },
  { id: "mercadao-aparecida", nome: "Mercadão", categoria: "MERCADO", tipo: "Supermercado", endereco: "Av. Santa Isabel, 483", bairro: "Aparecida", lat: -22.9538071, lng: -46.5341755 },
  { id: "mercadao-vila-esperanca", nome: "Mercadão", categoria: "MERCADO", tipo: "Supermercado", endereco: "R. Antônio Sabella, s/n", bairro: "Vila Esperança", lat: -22.9148115, lng: -46.5494761 },
  { id: "mercadao-matadouro", nome: "Mercadão", categoria: "MERCADO", tipo: "Supermercado", endereco: "Al. Quinze de Dezembro, 640", bairro: "Matadouro", lat: -22.9462974, lng: -46.5281019 },
  { id: "mercadao-parque-brasil", nome: "Mercadão", categoria: "MERCADO", tipo: "Supermercado", endereco: "R. João Franco, 1110", bairro: "Parque Brasil", lat: -22.9382967, lng: -46.5503341 },
  { id: "mercadao-santa-luzia", nome: "Mercadão", categoria: "MERCADO", tipo: "Supermercado", endereco: "R. Itapechinga, 270", bairro: "Santa Luzia", lat: -22.9700395, lng: -46.5500383 },
  { id: "supermercado-compre-facil-parque-brasil", nome: "Supermercado Compre-Fácil", categoria: "MERCADO", tipo: "Supermercado", endereco: "R. João Franco, 745", bairro: "Parque Brasil", lat: -22.9400808, lng: -46.547274 },
  { id: "sant-anna-escuer-silva-aparecida", nome: "Sant'Anna Escuer & Silva", categoria: "MERCADO", tipo: "Supermercado", endereco: "R. Aquidaban, 104", bairro: "Aparecida", lat: -22.9579886, lng: -46.533844 },
  { id: "supermercado-lisboa-taboao", nome: "Supermercado Lisboa", categoria: "MERCADO", tipo: "Supermercado", endereco: "R. Suster, 285", bairro: "Taboão", lat: -22.9724043, lng: -46.5385696 },
  { id: "mercado-nova-vicchi-taboao", nome: "Mercado Nova Vicchi", categoria: "MERCADO", tipo: "Supermercado", endereco: "Tv. São José, 193", bairro: "Taboão", lat: -22.9715604, lng: -46.5390024 },
  { id: "supermercado-bg-jardim-sao-miguel", nome: "Supermercado BG", categoria: "MERCADO", tipo: "Supermercado", endereco: "R. Pascoalino Cataldo, 385", bairro: "Jardim São Miguel", lat: -22.9464196, lng: -46.5602342 },
  { id: "supermercado-economia-cidade-planejada-ii", nome: "Supermercado Economia", categoria: "MERCADO", tipo: "Supermercado", endereco: "R. Francisco Assis Cintra, 16", bairro: "Cidade Planejada II", lat: -22.9119782, lng: -46.556682 },
  { id: "max-supermercados-cidade-planejada-i", nome: "Max Supermercados", categoria: "MERCADO", tipo: "Supermercado (rede local)", endereco: "Av. Nossa Sra. Conceição, 297", bairro: "Cidade Planejada I", lat: -22.9166315, lng: -46.5535573 },
  { id: "mercado-da-vida-penha", nome: "Mercado Da Vida", categoria: "MERCADO", tipo: "Mercado de bairro", endereco: "R. Expedicionário José Franco de Macedo, 644", bairro: "Penha", lat: -22.9381099, lng: -46.5188734 },
  { id: "mercado-101-henedina-cortez", nome: "Mercado 101", categoria: "MERCADO", tipo: "Mercado de bairro", endereco: "R. Benedito Augusto de Carvalho, 101", bairro: "Henedina Cortez", lat: -22.913596, lng: -46.5360601 },
  { id: "mp-todo-dia-dia-res-hipica-jaguari", nome: "MP Todo Dia (Dia)", categoria: "MERCADO", tipo: "Mercado de bairro", endereco: "R. Gentil de Matos, 200", bairro: "Res. Hípica Jaguari", lat: -22.9134003, lng: -46.5350669 },
  { id: "supermercado-oliveira-morro-grande-zona-rural", nome: "Supermercado Oliveira", categoria: "MERCADO", tipo: "Supermercado", endereco: "Rod. Aldo Bolini, km 74,5", bairro: "Morro Grande (zona rural)", lat: -23.0138312, lng: -46.4428447 },
  { id: "mercado-municipal-de-braganca-paulista-centro", nome: "Mercado Municipal de Bragança Paulista", categoria: "MERCADO", tipo: "Mercado municipal", endereco: "R. Cel. Teófilo Leme, 1240", bairro: "Centro", lat: -22.9527447, lng: -46.5408635 },
  { id: "varejao-lavapes-vila-mota", nome: "Varejão Lavapés", categoria: "MERCADO", tipo: "Hortifruti", endereco: "R. Advogado Zeferino Vasconcelos, 34", bairro: "Vila Mota", lat: -22.9491675, lng: -46.5445486 },
  { id: "varejao-ki-fruta-jardim-novo-mundo", nome: "Varejão Ki Fruta", categoria: "MERCADO", tipo: "Hortifruti", endereco: "R. João Franco, 831", bairro: "Jardim Novo Mundo", lat: -22.9397354, lng: -46.5480283 },
  { id: "varejao-sao-jose-taboao", nome: "Varejão São José", categoria: "MERCADO", tipo: "Hortifruti", endereco: "R. Suster, 240", bairro: "Taboão", lat: -22.9720551, lng: -46.5388644 },
  { id: "frutao-hortifruti-jardim-america", nome: "Frutão Hortifruti", categoria: "MERCADO", tipo: "Hortifruti", endereco: "Av. Alberto Diniz, 1181", bairro: "Jardim América", lat: -22.9693835, lng: -46.5565995 },
  { id: "varejao-santo-antonio-centro", nome: "Varejão Santo Antônio", categoria: "MERCADO", tipo: "Hortifruti", endereco: "Tv. Itália, 164", bairro: "Centro", lat: -22.9505421, lng: -46.5410482 },
  { id: "pomar-urbano-cidade-planejada-i", nome: "Pomar Urbano", categoria: "MERCADO", tipo: "Hortifruti", endereco: "Av. Nossa Sra. Conceição, 150", bairro: "Cidade Planejada I", lat: -22.9168651, lng: -46.5521052 },
  // ---- PADARIA ----
  { id: "padaria-badajoz-centro", nome: "Padaria Badajoz", categoria: "PADARIA", tipo: "Padaria", endereco: "R. Dr. Cândido Rodrigues, 210", bairro: "Centro", lat: -22.9532575, lng: -46.5422651 },
  { id: "padaria-e-confeitaria-new-cardoso-centro", nome: "Padaria e Confeitaria New Cardoso", categoria: "PADARIA", tipo: "Padaria", endereco: "R. Barão de Juqueri, 86", bairro: "Centro", lat: -22.95166, lng: -46.542445 },
  { id: "panificadora-largo-das-pedras-centro", nome: "Panificadora Largo das Pedras", categoria: "PADARIA", tipo: "Padaria", endereco: "Pça. Jacinto Domingues, 22", bairro: "Centro", lat: -22.9595186, lng: -46.54058 },
  { id: "padaria-9-de-julho-centro", nome: "Padaria 9 de Julho", categoria: "PADARIA", tipo: "Padaria", endereco: "R. Tupi, 214", bairro: "Centro", lat: -22.9683261, lng: -46.5419005 },
  { id: "padaria-bem-bolado-centro", nome: "Padaria Bem Bolado", categoria: "PADARIA", tipo: "Padaria", endereco: "Av. Antônio Pires Pimentel, 779", bairro: "Centro", lat: -22.955371, lng: -46.5394667 },
  { id: "basilico-padaria-artesanal-taboao", nome: "Basílico Padaria Artesanal", categoria: "PADARIA", tipo: "Padaria", endereco: "Tv. Taboão, 26", bairro: "Taboão", lat: -22.9670207, lng: -46.5418074 },
  { id: "divino-pao-taboao", nome: "Divino Pão", categoria: "PADARIA", tipo: "Padaria", endereco: "R. Teixeira, 204", bairro: "Taboão", lat: -22.9713779, lng: -46.5381721 },
  { id: "padaria-serra-encantada-vila-mota", nome: "Padaria Serra Encantada", categoria: "PADARIA", tipo: "Padaria", endereco: "R. Dr. Cândido Fontoura da Silveira, 561", bairro: "Vila Mota", lat: -22.9492894, lng: -46.5501447 },
  { id: "padaria-do-posto-tasca-jardim-america", nome: "Padaria do Posto Tasca", categoria: "PADARIA", tipo: "Padaria", endereco: "Av. dos Imigrantes, 2171", bairro: "Jardim América", lat: -22.9527523, lng: -46.5475221 },
  { id: "panificadora-lu-e-dora-cidade-planejada-ii", nome: "Panificadora Lu e Dora", categoria: "PADARIA", tipo: "Padaria", endereco: "R. Armando Biazini, 219", bairro: "Cidade Planejada II", lat: -22.9101805, lng: -46.5516388 },
  { id: "padaria-e-confeitaria-estrela-do-parque-cidade-p", nome: "Padaria e Confeitaria Estrela do Parque", categoria: "PADARIA", tipo: "Padaria", endereco: "R. Benedito Gonçalves Borges, 47", bairro: "Cidade Planejada II", lat: -22.9135688, lng: -46.5531857 },
  { id: "panificadora-s-souza-sabor-mil-cidade-planejada-", nome: "Panificadora S.Souza Sabor Mil", categoria: "PADARIA", tipo: "Padaria", endereco: "R. José Botinha Maciel, 257", bairro: "Cidade Planejada II", lat: -22.9103358, lng: -46.5545062 },
  { id: "casa-de-paes-e-bolos-estela-lima-cidade-planejad", nome: "Casa de Pães e Bolos Estela Lima", categoria: "PADARIA", tipo: "Padaria", endereco: "Av. Dep. Virgílio de Carvalho Pinto, 392", bairro: "Cidade Planejada I", lat: -22.9183799, lng: -46.5545405 },
  { id: "padaria-pao-celeste-cidade-planejada-i", nome: "Padaria Pão Celeste", categoria: "PADARIA", tipo: "Padaria", endereco: "R. Francisco Martins Ferreira Júnior, 587", bairro: "Cidade Planejada I", lat: -22.9208662, lng: -46.5593052 },
  { id: "panificadora-lima-parque-dos-estados", nome: "Panificadora Lima", categoria: "PADARIA", tipo: "Padaria", endereco: "R. Rondônia, 212", bairro: "Parque dos Estados", lat: -22.9138297, lng: -46.5572403 },
  { id: "panificadora-di-trigo-pan-jardim-sao-miguel", nome: "Panificadora Di Trigo Pan", categoria: "PADARIA", tipo: "Padaria", endereco: "R. Dante Lenzi, 102", bairro: "Jardim São Miguel", lat: -22.947768, lng: -46.561969 },
  { id: "panificadora-agata-jardim-sao-miguel", nome: "Panificadora Ágata", categoria: "PADARIA", tipo: "Padaria", endereco: "R. Silvério Salvador Polidori, 30", bairro: "Jardim São Miguel", lat: -22.9435917, lng: -46.5618109 },
  { id: "padaria-novaes-jardim-sao-miguel", nome: "Padaria Novaes", categoria: "PADARIA", tipo: "Padaria", endereco: "R. Estevan José do Carmo, 88", bairro: "Jardim São Miguel", lat: -22.9437456, lng: -46.5601253 },
  { id: "panificadora-n-sra-aparecida-jd-santa-rita-de-ca", nome: "Panificadora N. Sra. Aparecida", categoria: "PADARIA", tipo: "Padaria", endereco: "R. Aquidaban, 52", bairro: "Jd. Santa Rita de Cássia", lat: -22.9567158, lng: -46.5357236 },
  { id: "panificadora-braganca-paes-aparecida", nome: "Panificadora Bragança Pães", categoria: "PADARIA", tipo: "Padaria", endereco: "R. Santa Bárbara, 670", bairro: "Aparecida", lat: -22.9551766, lng: -46.5341615 },
  { id: "padaria-demir-aparecida", nome: "Padaria Demir", categoria: "PADARIA", tipo: "Padaria", endereco: "R. Prof. Luiz Nardy, 800", bairro: "Aparecida", lat: -22.9561125, lng: -46.5333707 },
  { id: "panificadora-matos-santa-luzia", nome: "Panificadora Matos", categoria: "PADARIA", tipo: "Padaria", endereco: "R. Itapechinga, 425", bairro: "Santa Luzia", lat: -22.9700904, lng: -46.5514966 },
  { id: "padaria-n-sra-da-aparecida-vila-garcia", nome: "Padaria N. Sra. da Aparecida", categoria: "PADARIA", tipo: "Padaria", endereco: "R. Maria do Carmo Teixeira Galasso, 10", bairro: "Vila Garcia", lat: -22.9417037, lng: -46.5530455 },
  { id: "padaria-san-francisco-matadouro", nome: "Padaria San Francisco", categoria: "PADARIA", tipo: "Padaria", endereco: "R. Madre Cândida Maria de Jesus, 219", bairro: "Matadouro", lat: -22.9485855, lng: -46.5391327 },
  // ---- FARMACIA ----
  { id: "droga-raia-imigrantes", nome: "Droga Raia", categoria: "FARMACIA", tipo: "Farmácia", endereco: "Av. dos Imigrantes", bairro: "Lavapés", lat: -22.952574, lng: -46.5471238 },
  { id: "droga-raia-joao-franco", nome: "Droga Raia", categoria: "FARMACIA", tipo: "Farmácia", endereco: "R. João Franco, 15", bairro: "Jardim São Cristóvão", lat: -22.9437323, lng: -46.542024 },
  { id: "drogaria-sao-paulo", nome: "Drogaria São Paulo", categoria: "FARMACIA", tipo: "Farmácia", endereco: "Av. Juscelino K. de Oliveira", bairro: "Vila Santa Libânia", lat: -22.9441165, lng: -46.5407493 },
  { id: "drogal-centro", nome: "Drogal", categoria: "FARMACIA", tipo: "Farmácia", endereco: "Av. José Gomes da Rocha Leal, 469", bairro: "Centro", lat: -22.9628269, lng: -46.5432111 },
  // ---- HOSPITAL ----
  { id: "santa-casa", nome: "Santa Casa de Bragança Paulista", categoria: "HOSPITAL", tipo: "Hospital · Pronto-socorro 24h", endereco: "R. Cel. Assis Gonçalves", bairro: "Centro", lat: -22.951222, lng: -46.5430656 },
  { id: "albert-sabin", nome: "Albert Sabin Hospital e Maternidade", categoria: "HOSPITAL", tipo: "Hospital e maternidade", endereco: "Av. Salvador Markowicz, 200", bairro: "Lagos de Santa Helena", lat: -22.982854, lng: -46.5287484 },
  { id: "upa-vila-davi", nome: "UPA Vila Davi (Dr. Valdir Camargo)", categoria: "HOSPITAL", tipo: "UPA 24h", endereco: "R. Sebastião Cícero Franco, 319", bairro: "Vila Davi", lat: -22.936479, lng: -46.548795 },
  { id: "upa-bom-jesus", nome: "UPA Bom Jesus", categoria: "HOSPITAL", tipo: "UPA 24h", endereco: "R. Santi Joanni Baptista, 200", bairro: "Res. Hípica Jaguari", lat: -22.9205108, lng: -46.5383015, obs: "No mesmo endereço: ESF Hípica Jaguari" },
  { id: "husf", nome: "Hospital Universitário São Francisco (HUSF)", categoria: "HOSPITAL", tipo: "Hospital", endereco: "Av. São Francisco de Assis, 260", bairro: "Cidade Universitária", lat: -22.9801836, lng: -46.5336338 },
  { id: "hospital-bragantino", nome: "Hospital Bragantino", categoria: "HOSPITAL", tipo: "Hospital", endereco: "R. Eunice Ferraz Fernandes, 151", bairro: "Jardim Nova Bragança", lat: -22.9721634, lng: -46.5334663 },
  // ---- POSTO_SAUDE ----
  { id: "esf-planejada-2", nome: "ESF Planejada II", categoria: "POSTO_SAUDE", tipo: "Posto de saúde (ESF)", endereco: "R. Agostinho Rosa, 260", bairro: "Cidade Planejada II", lat: -22.9118916, lng: -46.5522868 },
  { id: "esf-sao-vicente", nome: "ESF São Vicente (Dr. Geraldo de Assis Gonçalves)", categoria: "POSTO_SAUDE", tipo: "Posto de saúde (ESF)", endereco: "Av. São Vicente de Paula, 265", bairro: "Jardim Recreio", lat: -22.9340095, lng: -46.5301252 },
  { id: "esf-sao-lourenco", nome: "ESF São Lourenço", categoria: "POSTO_SAUDE", tipo: "Posto de saúde (ESF)", endereco: "Av. São Lourenço, 970", bairro: "Jardim São Lourenço", lat: -22.9401047, lng: -46.5406808 },
  { id: "esf-sao-miguel", nome: "ESF São Miguel", categoria: "POSTO_SAUDE", tipo: "Posto de saúde (ESF)", endereco: "R. Máximo Bertolini, 75", bairro: "Jardim São Miguel", lat: -22.9440368, lng: -46.56154 },
  { id: "cs-lavapes", nome: "Centro de Saúde Lavapés (Dr. Lourenço Quilicci)", categoria: "POSTO_SAUDE", tipo: "Centro de saúde", endereco: "R. Dona Carolina", bairro: "Lavapés", lat: -22.9480607, lng: -46.5412398 },
  { id: "esf-pedro-megale", nome: "ESF Pedro Megale", categoria: "POSTO_SAUDE", tipo: "Posto de saúde (ESF)", endereco: "R. Sen. Roberto Simonsen, 71", bairro: "Parque Brasil", lat: -22.941216, lng: -46.552305 },
  { id: "esf-parque-estados", nome: "ESF Parque dos Estados (I e II)", categoria: "POSTO_SAUDE", tipo: "Posto de saúde (ESF)", endereco: "R. Eriberto Cursi", bairro: "Parque dos Estados", lat: -22.9147649, lng: -46.5553963 },
  { id: "esf-vila-davi", nome: "ESF Vila David I", categoria: "POSTO_SAUDE", tipo: "Posto de saúde (ESF)", endereco: "R. Sebastião Cícero Franco", bairro: "Vila Davi", lat: -22.9332397, lng: -46.5505635 },
  // ---- CLINICA ----
  { id: "clinica-nova-braganca-jardim-nova-braganca", nome: "Clínica Nova Bragança", categoria: "CLINICA", tipo: "Clínica", endereco: "R. Cap. Daniel Peluso Júnior, 167", bairro: "Jardim Nova Bragança", lat: -22.9654026, lng: -46.5358645 },
  { id: "medite-laboratorio-de-analises-clinicas-jardim-n", nome: "Medite Laboratório de Análises Clínicas", categoria: "CLINICA", tipo: "Laboratório", endereco: "R. Cap. Daniel Peluso Júnior, 243", bairro: "Jardim Nova Bragança", lat: -22.965907, lng: -46.535454 },
  { id: "quartzlife-jardim-nova-braganca", nome: "Quartzlife", categoria: "CLINICA", tipo: "Clínica", endereco: "R. Cap. Daniel Peluso Júnior, 283", bairro: "Jardim Nova Bragança", lat: -22.96628, lng: -46.5350956 },
  { id: "laboratorio-analises-clinicas-braganca-centro", nome: "Laboratório Análises Clínicas Bragança", categoria: "CLINICA", tipo: "Laboratório", endereco: "R. Cel. Leme, 360", bairro: "Centro", lat: -22.9602131, lng: -46.5410439 },
  { id: "delta-lab-santa-casa-centro", nome: "Delta Lab - Santa Casa", categoria: "CLINICA", tipo: "Laboratório", endereco: "R. Cel. Assis Gonçalves, 712", bairro: "Centro", lat: -22.9513368, lng: -46.5436804 },
  { id: "unilab-laboratorio-clinico-centro", nome: "Unilab Laboratório Clínico", categoria: "CLINICA", tipo: "Laboratório", endereco: "R. José Domingues, 177", bairro: "Centro", lat: -22.963118, lng: -46.5413448 },
  { id: "cbi-centro-de-bioanalises-integradas-centro", nome: "CBI - Centro de Bioanálises Integradas", categoria: "CLINICA", tipo: "Laboratório", endereco: "R. Cel. Osório, 19", bairro: "Centro", lat: -22.9572182, lng: -46.5414144 },
  { id: "centromed-centro", nome: "CentroMed", categoria: "CLINICA", tipo: "Clínica", endereco: "R. Barão de Juqueri, 65", bairro: "Centro", lat: -22.9518985, lng: -46.54264 },
  { id: "clinica-braganca-taboao", nome: "Clínica Bragança", categoria: "CLINICA", tipo: "Clínica", endereco: "R. José Domingues, 238", bairro: "Taboão", lat: -22.9632666, lng: -46.5415744 },
  { id: "gms-clinica-medica-e-odontologica-lavapes", nome: "GMS Clínica Médica e Odontológica", categoria: "CLINICA", tipo: "Clínica", endereco: "Av. Antônio Pires Pimentel, 34", bairro: "Lavapés", lat: -22.9485321, lng: -46.5411834 },
  // ---- ESCOLA ----
  { id: "em-prof-sylvia-ferraz-fernandes-olmo-taboao", nome: "EM Profª Sylvia Ferraz Fernandes Olmo", categoria: "ESCOLA", tipo: "Escola municipal", endereco: "R. Treze de Maio, 38", bairro: "Taboão", lat: -22.97084, lng: -46.54275 },
  { id: "em-maria-siriani-del-nero-jardim-novo-mundo", nome: "EM Maria Siriani Del Nero", categoria: "ESCOLA", tipo: "Escola municipal", endereco: "", bairro: "Jardim Novo Mundo", lat: -22.9359568, lng: -46.5497822 },
  { id: "em-scyla-medici-jardim-recreio", nome: "EM Scyla Medici", categoria: "ESCOLA", tipo: "Escola municipal", endereco: "Av. São Vicente de Paula, 1", bairro: "Jardim Recreio", lat: -22.9388429, lng: -46.52874 },
  { id: "em-prof-maria-elisa-quadros-camara-aparecida", nome: "EM Profª Maria Elisa Quadros Câmara", categoria: "ESCOLA", tipo: "Escola municipal", endereco: "R. Maria Adalgisa Barbosa, 115", bairro: "Aparecida", lat: -22.9517159, lng: -46.532882 },
  { id: "colegio-educare-vila-municipal", nome: "Colégio Educare", categoria: "ESCOLA", tipo: "Escola particular", endereco: "R. Cel. Afonso Ferreira, 174", bairro: "Vila Municipal", lat: -22.9467798, lng: -46.5389073 },
  { id: "ee-fernando-siriani", nome: "EM Prof. Fernando Amos Siriani", categoria: "ESCOLA", tipo: "Escola municipal", endereco: "R. Ernesto Vaz de Lima", bairro: "Jardim da Fraternidade", lat: -22.9192638, lng: -46.5459844 },
  { id: "ee-jose-mauricio", nome: "EE Dom José Maurício da Rocha", categoria: "ESCOLA", tipo: "Escola estadual", endereco: "R. Sen. Roberto Simonsen, 106", bairro: "Parque Brasil", lat: -22.9412164, lng: -46.5523046 },
  { id: "ee-mathilde", nome: "EE Profª Mathilde Teixeira de Moraes", categoria: "ESCOLA", tipo: "Escola estadual", endereco: "R. Oswaldo Russomano", bairro: "Parque dos Estados", lat: -22.9148401, lng: -46.5546662 },
  { id: "ee-alegretti", nome: "EE Prof. Luiz Roberto Pinheiro Alegretti", categoria: "ESCOLA", tipo: "Escola estadual", endereco: "R. do Amor, 169", bairro: "Jardim São Lourenço", lat: -22.9369754, lng: -46.5437602 },
  { id: "ee-marcos-guimaraes", nome: "EE Prof. Marcos Antonio da Silva Guimarães", categoria: "ESCOLA", tipo: "Escola estadual", endereco: "R. João Diniz, 332", bairro: "Jardim Recreio", lat: -22.9366889, lng: -46.5291937 },
  { id: "ee-nantala-badue", nome: "EE Prof. José Nantala Badue", categoria: "ESCOLA", tipo: "Escola estadual", endereco: "R. Araras, 375", bairro: "Vila Santa Libânia", lat: -22.9455279, lng: -46.5516566 },
  { id: "em-abner", nome: "EM Prof. Abner Antonio Sperendio", categoria: "ESCOLA", tipo: "Escola municipal", endereco: "R. Argemiro Rocha de Moraes", bairro: "Cidade Planejada II", lat: -22.9095172, lng: -46.5496976 },
  { id: "em-dinorah", nome: "EM Prof. Dinorah Ramos", categoria: "ESCOLA", tipo: "Escola municipal", endereco: "R. Agostinho Rosa, 260", bairro: "Cidade Planejada II", lat: -22.9113768, lng: -46.5519357 },
  { id: "em-jorge-tibirica", nome: "EM Dr. Jorge Tibiriçá", categoria: "ESCOLA", tipo: "Escola municipal", endereco: "R. Dr. Tosta", bairro: "Centro", lat: -22.9578938, lng: -46.5423155, obs: "IDEB 7,0" },
  { id: "apicys", nome: "Colégio Apicys", categoria: "ESCOLA", tipo: "Escola particular", endereco: "Av. Francisca de Paula Pereira, 88", bairro: "Jardim São Lourenço", lat: -22.9336544, lng: -46.5365815 },
  { id: "cidade-braganca", nome: "Colégio Cidade de Bragança", categoria: "ESCOLA", tipo: "Escola particular", endereco: "Av. Salvador Markowicz, 620", bairro: "Santa Helena", lat: -22.9841383, lng: -46.5273818 },
  { id: "equilibrium", nome: "Colégio Equilibrium", categoria: "ESCOLA", tipo: "Escola particular", endereco: "R. Dr. José Adriano Marrey Jr., 450", bairro: "Aparecida", lat: -22.9508142, lng: -46.533117 },
  { id: "illuminare", nome: "Colégio Illuminare", categoria: "ESCOLA", tipo: "Escola particular", endereco: "R. Cel. Osório, 194", bairro: "Centro", lat: -22.9581647, lng: -46.5410257 },
  { id: "porto-braganca", nome: "Colégio Porto Bragança", categoria: "ESCOLA", tipo: "Escola particular", endereco: "R. Europa, 999", bairro: "Jardim Europa", lat: -22.9745877, lng: -46.5456911 },
  { id: "coracao-jesus", nome: "Instituto Educacional Coração de Jesus", categoria: "ESCOLA", tipo: "Escola particular", endereco: "R. José Guilherme, 493", bairro: "Centro", lat: -22.9649138, lng: -46.5402439 },
  { id: "sesi", nome: "SESI Bragança Paulista", categoria: "ESCOLA", tipo: "Escola do SESI", endereco: "Av. Ernesto Vaz de Lima, 740", bairro: "Jardim Morumbi", lat: -22.9196252, lng: -46.5448555 },
  { id: "objetivo", nome: "Colégio Objetivo", categoria: "ESCOLA", tipo: "Escola particular", endereco: "R. Palmiro Orsi, 121", bairro: "Santa Luzia", lat: -22.9725746, lng: -46.5512163 },
  { id: "viverde", nome: "Viverde Escola de Educação Básica", categoria: "ESCOLA", tipo: "Escola particular", endereco: "Rod. Capitão Barduíno, km 98,5", bairro: "Jardim das Palmeiras", lat: -22.8711843, lng: -46.531821, obs: "Fica no Condomínio Jardim das Palmeiras" },
  { id: "ee-jose-guilherme", nome: "EE José Guilherme", categoria: "ESCOLA", tipo: "Escola estadual", endereco: "R. Dona Carolina, 60", bairro: "Centro", lat: -22.9491541, lng: -46.5433951 },
  { id: "colegio-integral", nome: "Colégio Integral", categoria: "ESCOLA", tipo: "Escola particular", endereco: "Av. Salvador Markowicz, 571", bairro: "Jardim São José", lat: -22.9823408, lng: -46.5288579 },
  // ---- CRECHE ----
  { id: "em-prof-dalva-carmignotto-da-graca-jardim-frater", nome: "EM Profª Dalva Carmignotto da Graça", categoria: "CRECHE", tipo: "Educação infantil municipal", endereco: "Av. Ernesto Vaz de Lima, 751", bairro: "Jardim Fraternidade", lat: -22.9189016, lng: -46.545523 },
  { id: "brincar-e-aprender-res-hipica-jaguari", nome: "Brincar e Aprender", categoria: "CRECHE", tipo: "Educação infantil particular", endereco: "R. Carlos Palazzi, 262", bairro: "Res. Hípica Jaguari", lat: -22.9180867, lng: -46.5413945 },
  { id: "colegio-educare-little-kids-lagos-de-santa-helen", nome: "Colégio Educare Little Kids", categoria: "CRECHE", tipo: "Educação infantil particular", endereco: "R. Francisco Luigi Picarelli, 87", bairro: "Lagos de Santa Helena", lat: -22.981385, lng: -46.529606 },
  { id: "colegio-pequenos-passos-vila-bianchi", nome: "Colégio Pequenos Passos", categoria: "CRECHE", tipo: "Educação infantil particular", endereco: "R. Voluntário Carlos Gonzáles, 211", bairro: "Vila Bianchi", lat: -22.9405596, lng: -46.5325963 },
  { id: "jardim-america-educacao-infantil-bilingue-jardim", nome: "Jardim América Educação Infantil Bilíngue", categoria: "CRECHE", tipo: "Educação infantil particular", endereco: "Av. Nipo-Brasileira, 278", bairro: "Jardim América", lat: -22.9565625, lng: -46.5488724 },
  { id: "colegio-santa-barbara-unidade-i-educacao-infanti", nome: "Colégio Santa Bárbara – Unidade I (Educação Infantil)", categoria: "CRECHE", tipo: "Educação infantil particular", endereco: "R. Humaitá, 35", bairro: "Jd. Santa Rita de Cássia", lat: -22.9561153, lng: -46.5365482 },
  { id: "em-alba-klein", nome: "EM Profª Alba D'Aparecida Klein", categoria: "CRECHE", tipo: "Educação infantil municipal", endereco: "R. Santa Cruz, 1180", bairro: "Vila Santa Libânia", lat: -22.9462387, lng: -46.5439142 },
  { id: "em-antonio-fonseca", nome: "EM Antonio José da Fonseca", categoria: "CRECHE", tipo: "Educação infantil municipal", endereco: "R. Amazonas", bairro: "Parque dos Estados", lat: -22.9129005, lng: -46.5560306 },
  // ---- FACULDADE ----
  { id: "fesb", nome: "FESB — Fundação Municipal de Ensino Superior", categoria: "FACULDADE", tipo: "Faculdade municipal", endereco: "Av. Francisco Samuel Lucchesi Filho, 770", bairro: "Penha", lat: -22.9457642, lng: -46.5270206 },
  { id: "senai", nome: "SENAI Bragança Paulista", categoria: "FACULDADE", tipo: "Cursos técnicos (SENAI)", endereco: "Av. Ernesto Vaz de Lima, 570", bairro: "Jardim Morumbi", lat: -22.9210354, lng: -46.545474 },
  { id: "usf", nome: "Universidade São Francisco (USF)", categoria: "FACULDADE", tipo: "Universidade", endereco: "Av. São Francisco de Assis, 218", bairro: "Cidade Universitária", lat: -22.978794, lng: -46.5348336 },
  { id: "fatec", nome: "FATEC e ETEC Bragança Paulista", categoria: "FACULDADE", tipo: "Faculdade e escola técnica estaduais (gratuitas)", endereco: "R. da Tecnologia, 130", bairro: "Uberaba", lat: -22.9232916, lng: -46.5463266 },
  // ---- ACADEMIA ----
  { id: "smart-fit-taboao", nome: "Smart Fit", categoria: "ACADEMIA", tipo: "Academia", endereco: "Av. Alpheu Grimello, 650", bairro: "Taboão", lat: -22.9742608, lng: -46.5355655 },
  { id: "bluefit-jardim-sao-miguel", nome: "BlueFit", categoria: "ACADEMIA", tipo: "Academia", endereco: "Av. Dr. Plínio Salgado, 300", bairro: "Jardim São Miguel", lat: -22.9523056, lng: -46.5484653 },
  { id: "sky-fit-matadouro", nome: "Sky Fit", categoria: "ACADEMIA", tipo: "Academia", endereco: "Al. Quinze de Dezembro, 250", bairro: "Matadouro", lat: -22.9475609, lng: -46.5283928 },
  { id: "academia-gavioes-24h-jardim-america", nome: "Academia Gaviões 24h", categoria: "ACADEMIA", tipo: "Academia · 24h", endereco: "Av. dos Imigrantes, 1227", bairro: "Jardim América", lat: -22.9646284, lng: -46.5444177 },
  { id: "work-gym-vila-santa-libania", nome: "Work Gym", categoria: "ACADEMIA", tipo: "Academia", endereco: "Av. Eusébio Savaio, 388", bairro: "Vila Santa Libânia", lat: -22.9434111, lng: -46.5445211 },
  { id: "ms-fitness-parque-brasil", nome: "MS Fitness", categoria: "ACADEMIA", tipo: "Academia", endereco: "R. Sen. Roberto Simonsen, 254", bairro: "Parque Brasil", lat: -22.9397971, lng: -46.5531104 },
  // ---- RESTAURANTE ----
  { id: "restaurante-casarao-centro", nome: "Restaurante Casarão", categoria: "RESTAURANTE", tipo: "Restaurante", endereco: "Pça. José Bonifácio, 110", bairro: "Centro", lat: -22.9571103, lng: -46.5414588 },
  { id: "churrascaria-coracao-gaucho-centro", nome: "Churrascaria Coração Gaúcho", categoria: "RESTAURANTE", tipo: "Churrascaria", endereco: "Pça. Jacinto Domingues, 53", bairro: "Centro", lat: -22.9598033, lng: -46.5405424 },
  { id: "alma-bragantina-centro", nome: "Alma Bragantina", categoria: "RESTAURANTE", tipo: "Restaurante", endereco: "R. Expedicionário Basílio Zecchin Júnior, 44", bairro: "Centro", lat: -22.9566707, lng: -46.5411162 },
  { id: "o-pedaco-pizza-bar-centro", nome: "O Pedaço Pizza - Bar", categoria: "RESTAURANTE", tipo: "Pizzaria", endereco: "Av. Antônio Pires Pimentel, 702", bairro: "Centro", lat: -22.9548747, lng: -46.5398693 },
  { id: "pizzaria-extra-fina-centro", nome: "Pizzaria Extra Fina", categoria: "RESTAURANTE", tipo: "Pizzaria", endereco: "Av. Antônio Pires Pimentel, 1147", bairro: "Centro", lat: -22.9586796, lng: -46.5386612 },
  { id: "pizzaria-braganca-centro", nome: "Pizzaria Bragança", categoria: "RESTAURANTE", tipo: "Pizzaria", endereco: "Av. José Gomes da Rocha Leal, 1498", bairro: "Centro", lat: -22.954065, lng: -46.544921 },
  { id: "porteira-gaucha-grill-jardim-sao-jose", nome: "Porteira Gaúcha Grill", categoria: "RESTAURANTE", tipo: "Churrascaria", endereco: "Av. Alpheu Grimello, 346", bairro: "Jardim São José", lat: -22.971989, lng: -46.5370938 },
  { id: "grill-sul-churrascaria-jardim-do-lago", nome: "Grill Sul Churrascaria", categoria: "RESTAURANTE", tipo: "Churrascaria", endereco: "Av. Marcelo Stefani, 209", bairro: "Jardim do Lago", lat: -22.9720355, lng: -46.5339433 },
  { id: "esmeralda-restaurante-e-pizzaria-jardim-nova-bra", nome: "Esmeralda Restaurante e Pizzaria", categoria: "RESTAURANTE", tipo: "Restaurante", endereco: "R. Eunice Ferraz Fernandes, 250", bairro: "Jardim Nova Bragança", lat: -22.9721634, lng: -46.5334663 },
  { id: "lopo-restaurante-taboao", nome: "Lopo Restaurante", categoria: "RESTAURANTE", tipo: "Restaurante", endereco: "R. Teixeira, 186", bairro: "Taboão", lat: -22.9712144, lng: -46.5382124 },
  { id: "serrana-grill-churrascaria-jardim-america", nome: "Serrana Grill Churrascaria", categoria: "RESTAURANTE", tipo: "Churrascaria", endereco: "Av. dos Imigrantes, 1646", bairro: "Jardim América", lat: -22.9581796, lng: -46.5454915 },
  // ---- COMPRAS ----
  { id: "havan-itapechinga-proximo-ao-garden-shopping", nome: "Havan", categoria: "COMPRAS", tipo: "Loja de departamentos", endereco: "Rod. Alkindar Monteiro Junqueira, 1013", bairro: "Itapechinga / próximo ao Garden Shopping", lat: -22.970069, lng: -46.568628 },
  { id: "telhanorte-jardim-nova-braganca", nome: "Telhanorte", categoria: "COMPRAS", tipo: "Material de construção", endereco: "Av. Dom Pedro I, 2766", bairro: "Jardim Nova Bragança", lat: -22.9816291, lng: -46.5273892 },
  { id: "garden-shopping", nome: "Bragança Garden Shopping", categoria: "COMPRAS", tipo: "Shopping · cinema e Poupatempo", endereco: "Rod. Alkindar Monteiro Junqueira, 1013", bairro: "Campo Novo", lat: -22.9700507, lng: -46.5680453 },
  { id: "euroville-mall", nome: "Euroville Mall", categoria: "COMPRAS", tipo: "Shopping a céu aberto · cinema", endereco: "Praça Maastricht, 200", bairro: "Residencial Euroville", lat: -22.976349, lng: -46.5457274 },
  // ---- BANCO ----
  { id: "bb-jose-bonifacio", nome: "Banco do Brasil", categoria: "BANCO", tipo: "Agência bancária", endereco: "Pça. José Bonifácio, 140", bairro: "Centro", lat: -22.9570845, lng: -46.5418446 },
  { id: "bb-raul-leme", nome: "Banco do Brasil", categoria: "BANCO", tipo: "Agência bancária", endereco: "Pça. Raul Leme, 212", bairro: "Centro", lat: -22.955952, lng: -46.5417765 },
  { id: "caixa-osorio", nome: "Caixa", categoria: "BANCO", tipo: "Agência bancária", endereco: "R. Cel. Osório, 125", bairro: "Centro", lat: -22.9581647, lng: -46.5410257 },
  { id: "caixa-freitas", nome: "Caixa", categoria: "BANCO", tipo: "Agência bancária", endereco: "R. Dr. Freitas, 171", bairro: "Matadouro", lat: -22.9437175, lng: -46.5370862 },
  { id: "bradesco", nome: "Bradesco", categoria: "BANCO", tipo: "Agência bancária", endereco: "R. Dr. Cândido Rodrigues, 139", bairro: "Centro", lat: -22.9532575, lng: -46.5422651 },
  { id: "itau-raul-leme", nome: "Itaú", categoria: "BANCO", tipo: "Agência bancária", endereco: "R. Cel. Teófilo Leme, 1384", bairro: "Centro", lat: -22.9511309, lng: -46.5410964 },
  { id: "santander", nome: "Santander", categoria: "BANCO", tipo: "Agência bancária", endereco: "Pça. Raul Leme, 265", bairro: "Centro", lat: -22.95616, lng: -46.5424576 },
  // ---- POSTO ----
  { id: "posto-petrobras-lavapes", nome: "Posto Petrobras", categoria: "POSTO", tipo: "Posto de combustível", endereco: "Av. dos Imigrantes, 2500", bairro: "Lavapés", lat: -22.95109, lng: -46.54631 },
  { id: "posto-shell-centro", nome: "Posto Shell", categoria: "POSTO", tipo: "Posto de combustível · 24h", endereco: "Av. dos Imigrantes, 2171", bairro: "Centro", lat: -22.9528011, lng: -46.5472524 },
  { id: "posto-shell-centro-2", nome: "Posto Shell", categoria: "POSTO", tipo: "Posto de combustível", endereco: "Av. José Gomes da Rocha Leal, 1718", bairro: "Centro", lat: -22.951837, lng: -46.544943 },
  { id: "posto-valle-conveniencia-centro", nome: "Posto Valle Conveniência", categoria: "POSTO", tipo: "Posto de combustível", endereco: "Av. José Gomes da Rocha Leal, 717", bairro: "Centro", lat: -22.9604114, lng: -46.5433679 },
  { id: "auto-posto-pires-pimentel-centro", nome: "Auto Posto Pires Pimentel", categoria: "POSTO", tipo: "Posto de combustível", endereco: "Av. Antônio Pires Pimentel, 229", bairro: "Centro", lat: -22.9504365, lng: -46.5405442 },
  { id: "posto-capivarao-ipiranga-taboao", nome: "Posto Capivarão / Ipiranga", categoria: "POSTO", tipo: "Posto de combustível · 24h", endereco: "Av. Dom Pedro I, 2526", bairro: "Taboão", lat: -22.9805996, lng: -46.5284711 },
  { id: "posto-dom-pedro-braganca-penha", nome: "Posto Dom Pedro Bragança", categoria: "POSTO", tipo: "Posto de combustível · 24h", endereco: "Rod. Fernão Dias, km 17", bairro: "Penha", lat: -22.9694996, lng: -46.4851478 },
  { id: "posto-petrobras-chacaras-fernao-dias", nome: "Posto Petrobras", categoria: "POSTO", tipo: "Posto de combustível", endereco: "Rod. Fernão Dias, km 25", bairro: "Chácaras Fernão Dias", lat: -23.0238705, lng: -46.5339146 },
];
