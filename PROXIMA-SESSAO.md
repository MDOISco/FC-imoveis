# Próxima sessão — o que ficou combinado com a dona

Atualizado em 30/10/2026, na sessão dos estabelecimentos próximos.
Leia junto com o `CLAUDE.md`.

## Feito nesta sessão (30/10/2026)

1. **Estabelecimentos da cidade** em `lib/cidade/estabelecimentos.ts`
   (163 lugares com coordenada real): a planilha do Google Maps da dona
   (2ª versão, com 38 mercados e hortifrútis, 24 padarias, postos,
   academias, restaurantes, clínicas, laboratórios, lojas e parte das
   escolas e creches) + hospitais, UPAs, postos de saúde, escolas,
   creches municipais, faculdades, shoppings, farmácias e bancos do
   relatório, localizados no OpenStreetMap e conferidos um a um (nome e
   bairro/rua precisavam bater; o que não bateu ficou de fora).
2. **Segundo mapa em Conheça Bragança** (`/cidade#estabelecimentos`), com
   botões por categoria e os condomínios (Jardim das Palmeiras ★ primeiro).
3. **"O que tem perto" na página do imóvel** (site e link exclusivo), só
   em faixas de distância, e na **busca do site** ("Perto de").
4. **Localização automática dos imóveis** (`lib/geo/`): ao salvar o
   endereço; os antigos se localizam sozinhos. Na ficha, a equipe confere
   e arrasta o marcador. A coordenada fica só no banco.
5. **Lugares próximos nas descrições geradas** (templates e IA).
6. **Lista oficial de bairros (182) e condomínios (91)** em
   `lib/cidade/bairros.ts` e `lib/cidade/condominios.ts`: sugestões no
   cadastro, grafia única e a busca mostra todos.

## Pendente: lugares do relatório que ficaram SEM posição

Não deu para localizar com segurança no mapa aberto. Se a dona mandar a
latitude/longitude do Google Maps (como fez na planilha), é só acrescentar
uma linha em `lib/cidade/estabelecimentos.ts`.

- **Faculdade:** IFSP (o mapa aberto ainda mostra o endereço antigo, na
  FESB; o oficial é Av. Major Fernando Valle, 2013 – São Miguel).
- **Hospitais:** Hospital de Olhos Bragança, Hospital São Pedro.
- **Postos de saúde:** ESF Planejada I, CDHU Saada Nader, Água Clara I,
  São Francisco de Assis, UBS Vila Aparecida, Madre Paulina, Casa de
  Jesus, Cidade Jardim, Nilda Colli, Henedina Cortez, Penha, Toró, UBS
  Santa Luzia, Vila Bianchi, Vila Motta e as rurais (Água Comprida, Arara
  dos Mori, Biriçá do Valado, Mãe dos Homens, Morro Grande).
- **Escolas:** EE Alcindo Bueno de Assis, Bruno Florenzano, Cásper Líbero,
  Dom Bruno Gamberini, Cel. Francisco de Assis Gonçalves, Inaldo Manta,
  Ismael Aguiar Leme, Sebastião Ferraz de Campos; EM Augusto Vasconcellos
  (IDEB 7,0), Antonio Dorival, Arline Menin, Carlos Frederico, Creusa
  Gomes, Lucy Alvarez, José Murillo Arruda, Maria José de Campos Dorigo e
  as escolas rurais; Colégio Adventista, AZ, Guimarães Rosa, Santa Bárbara
  (unidade da R. Sete de Setembro — a de educação infantil já está), Maple
  Bear, APAE, São Matheus, Santo Agostinho; Colégio Integrado (mesmo
  endereço do Objetivo — confirmar se é o mesmo colégio); Inst. Santa
  Terezinha (no Google, o endereço dele aparece como Colégio Educare, que
  já está no mapa — confirmar).
- **Creches municipais:** Adalmir Duaik, Affonso Risi, Padre Aldo Bolini,
  Antonietta Lisa, Célia Grasson, Marice Suarez, Marilis Abi Chedid,
  Therezinha Bellotto.
- **Faculdades e cursos:** Polo UAB (R. Alexandre Berbari, 101), Centro
  Paulista de Estudos Agropecuários (R. João Siriani, 313), Esatec,
  Instituto Técnico Profissionalizante, Colégio Técnico N. Sra. das Graças,
  Nova Biotec.
- **Outros:** Rodoviária, Farmácias Pague Menos (R. Felipe Siqueira, 213),
  Drogaria São Paulo da Av. dos Imigrantes, 900 (no mapa só aparece a da
  Av. JK), Caixa da R. Tupy.
- **Planilha:** "Vivendo e Aprendendo" e "Educare Little Kids" estão no
  mesmo endereço; ficou só o Educare (nome confirmado no Censo Escolar
  2025). Confirmar com a dona. A coordenada da EM Sylvia Olmo no Google
  caiu a 2 km da R. Treze de Maio; foi usado o ponto da rua.

## Ideias para depois

- Mais farmácias, padarias e mercados (a planilha é uma amostra; cada
  busca do Google Maps devolve só 10).
- "Perto de" um lugar específico na busca (ex.: perto da USF ou do HUSF).
- Usar a lista oficial de bairros também no cadastro do cliente
  (`/permutas/cadastrar`) e nas preferências de troca.
- Conferir no mapa os agrupamentos por região de `lib/cidade/bairros.ts`
  (são indicativos, a Prefeitura não tem divisão oficial).

## Como a busca do site funciona (para não reinventar)

- `lib/busca-site.ts`: as regras da busca, usadas no servidor e no
  navegador. É a mesma regra nos dois lados, por isso o número ao vivo
  bate com o resultado.
- `components/site/busca-imoveis.tsx`: a caixa interativa, logo abaixo do
  banner do site (`/`).
- Privacidade que já está valendo:
  - bairro e condomínio de imóvel marcado como "não mostrar nem o bairro"
    não entram na busca (e o "O que tem perto" também não aparece);
  - valor "sob consulta" não entra no filtro nem na ordenação por preço;
  - o item de busca leva só a FAIXA de distância por categoria, nunca a
    coordenada.
- "Onde?" mostra a lista oficial inteira (182 bairros e 91 condomínios),
  mas de cara só os que têm imóvel publicado (e o Jardim das Palmeiras ★);
  o resto em "Ver todos" (bairros agrupados por região) ou digitando.
- "Perto de": o cliente escolhe categorias e a distância (500 m, 1 km ou
  2 km); só aparece quando algum imóvel publicado tem localização boa.
- Links antigos com grafia variante ("Vila Motta", "Jd. Palmeiras") são
  lidos com o nome oficial.
