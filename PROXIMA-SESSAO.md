# Próxima sessão — pedidos já combinados com a dona

Anotado em 30/10/2026, na sessão que fez o logo e a busca do site.
Leia junto com o `CLAUDE.md`.

## 1. Mapear os pontos de Bragança Paulista

A dona vai pedir para mapear **todos** estes lugares da cidade:

- escolas
- faculdades
- creches
- hospitais (incluir UPA e posto de saúde)
- mercados e supermercados
- padarias

Ela também vai trazer mais ideias. Algumas para sugerir: farmácias,
academias, bancos/lotéricas, rodoviária, parques e praças, shopping.

Como fazer:
- Usar o OpenStreetMap (API Overpass, não precisa de chave) e conferir os
  nomes.
- Guardar em `lib/cidade/`, no mesmo formato de `lib/cidade/pontos.ts`
  (nome, categoria, emoji, latitude e longitude reais).
- O mapa `/cidade` pode mostrar os pontos por categoria.

## 2. Usar esses pontos nos imóveis e na busca

- **Na página do imóvel**, mostrar automaticamente o que tem perto, por
  exemplo "🥖 Padaria X a 350 m" ou "🏫 Escola Y a 1,2 km". Também dá para
  usar nas descrições geradas.
- **Na busca do site** (`components/site/busca-imoveis.tsx`), incluir
  "Perto de": um ponto específico ou uma categoria (perto de escola,
  perto de mercado), com uma distância máxima.
- Para isso, cada imóvel precisa de latitude/longitude. Hoje o banco não
  tem esse dado: criar um campo novo e calcular a partir do endereço
  completo no cadastro (geocodificação, uma vez só).

**Regra da casa (privacidade):** a coordenada do imóvel fica **só no
banco**. Nunca vai para página pública nem para os portais. Para o
público, mostrar só distâncias arredondadas e em faixas (até 500 m, até
1 km…). Com distâncias exatas até vários pontos, dá para descobrir onde o
imóvel fica.

## 3. Lista completa de bairros, ruas e condomínios

- A dona vai mandar o site de uma imobiliária de Bragança como referência,
  para ver quantos bairros, ruas e condomínios existem.
- A lista precisa ter **todos os condomínios**.
- O **Jardim das Palmeiras é um CONDOMÍNIO** (não é bairro) e é o
  principal da imobiliária: fica **em primeiro, com uma estrela ★**.
  - Na busca isso já está feito: `CONDOMINIO_DESTAQUE` em
    `lib/busca-site.ts`.
  - Hoje a lista de condomínios e de bairros da busca vem só dos imóveis
    publicados (campo `condoName` e `neighborhood` do cadastro).
- Ideia: transformar a lista oficial em constante (como as de
  `lib/constants.ts`) e usar em dois lugares:
  1. no cadastro do corretor, como lista de escolha em vez de texto livre.
     Isso evita "Jd. Palmeiras" e "Jardim das Palmeiras" como se fossem
     dois lugares diferentes;
  2. na busca, mostrando todos os bairros e condomínios, mesmo sem imóvel
     publicado.

## Como a busca do site funciona hoje (para não reinventar)

- `lib/busca-site.ts`: as regras da busca, usadas no servidor e no
  navegador. É a mesma regra nos dois lados, por isso o número ao vivo
  bate com o resultado.
- `components/site/busca-imoveis.tsx`: a caixa interativa, logo abaixo do
  banner de `/site`.
- Privacidade que já está valendo:
  - bairro e condomínio de imóvel marcado como "não mostrar nem o bairro"
    não entram na busca;
  - valor "sob consulta" não entra no filtro nem na ordenação por preço.
