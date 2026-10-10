# FC Imóveis — Dashboard + Permutas

Sistema da FC Imóveis (Bragança Paulista/SP) com duas áreas:

- **Dashboard** (`/`) — uso interno dos corretores: cadastro completo de
  imóveis em 8 etapas, fotos com tratamento e marca d'água, vídeo, 3 sugestões
  de descrição (automáticas ou por IA), publicação automática nos portais por
  feed XML e gestão das permutas.
- **Permutas** (`/permutas`) — página pública: o cliente cadastra o próprio
  imóvel (vai para aprovação da equipe), explora um deck estilo "Tinder" e,
  quando os dois lados têm interesse, **a chave dourada se abre** (match). A
  equipe recebe o match com os contatos e conduz a negociação.

Feito para ser **fácil para corretores de mais idade**: letras grandes, botões
grandes, um passo de cada vez, mensagens claras em português.

## Como rodar

Requisitos: **Node.js 18.17 ou mais novo** (recomendado Node 20+).

```bash
npm install
npx prisma migrate dev   # cria o banco (SQLite, arquivo local)
npm run db:seed          # dados de demonstração (imóveis, leads, fotos)
npm run dev
```

Abra **http://localhost:3000** (dashboard) e **http://localhost:3000/permutas**
(página pública). O seed imprime no terminal os links privados dos clientes de
demonstração (painel de permutas de cada um).

> Para zerar e repopular a demonstração: apague `prisma/dev.db` e a pasta
> `storage/`, e rode `npx prisma migrate dev && npm run db:seed` de novo.

## O fluxo do corretor (resumo)

1. **Cadastrar imóvel** → passo a passo de 8 etapas, com salvamento de
   rascunho a cada etapa (pode fechar e continuar depois pelo card do painel).
2. **Etapa 2 (endereço)**: digite o CEP e o resto preenche sozinho (ViaCEP).
   **Padrão da casa: o público só vê cidade e bairro** — o endereço completo
   fica no sistema. Quem quiser a localização exata deixa contato (vira fila em
   Permutas → Pedidos de endereço).
3. **Etapa 5 (valores)**: inclui o toggle **"♻️ Disponível para PERMUTA"**,
   que coloca o imóvel na página pública de permutas.
4. **Etapa 6 (fotos e vídeo)**: fotos são tratadas e recebem a marca d'água
   automaticamente; dá para reordenar arrastando, girar, trocar a capa e
   ligar/desligar os ajustes por foto. Vídeo por upload (MP4/MOV até 200MB).
5. **Etapa 7 (descrição)**: o sistema escreve **3 descrições diferentes**
   (objetiva, acolhedora e para investidor) — escolha uma e ajuste à vontade.
6. **Etapa 8 (revisão)**: checklist do que falta, escolha dos portais e
   **Publicar**.

## Publicação automática nos portais

A integração é por **feed XML (padrão VRSync / Canal Pro)**: cada portal lê o
feed sozinho, de tempos em tempos — nada de redigitar anúncios.

1. Em **Configurações → Portais (feeds)**, salve o endereço público do sistema
   (o domínio onde ele estiver hospedado; `localhost` não funciona para os
   portais).
2. Copie a URL de cada feed e cadastre uma única vez no painel do portal:
   - **Canal Pro** (ZAP Imóveis + VivaReal + OLX): `/api/feeds/canalpro.xml`
   - **Chaves na Mão**: `/api/feeds/chavesnamao.xml`
   - **Imovelweb**: `/api/feeds/imovelweb.xml`
3. Imóveis **ATIVOS** com o portal ligado entram no feed na hora; o portal
   sincroniza em algumas horas. Regras: imóvel "sob consulta" não entra
   (portais exigem preço) e imóveis de clientes (permuta) nunca vão aos
   portais.

## Descrições por IA (opcional)

Em **Configurações → Descrições por IA**, cole uma chave da API do Claude
(Anthropic). Com a chave, as 3 sugestões passam a ser escritas por IA (modelo
`claude-opus-5-5`), usando somente os dados cadastrados — sem inventar nada.
Sem chave (ou se a IA falhar), o sistema usa o gerador automático embutido, que
funciona offline. A chave fica mascarada e nunca aparece por inteiro.

## Permutas (a página do match)

- O corretor marca imóveis da carteira com a tag **PERMUTA** (etapa 5).
- O cliente acessa `/permutas`, cadastra o imóvel dele em 6 passos simples
  (fotos, dados e a descrição com as palavras dele) e diz **o que procura** na
  troca. Sem senha: ele recebe um **link privado** de acesso.
- O cadastro cai em **Permutas → Aprovações** no dashboard: a equipe revisa,
  pode gerar as 3 sugestões de descrição, escolhe o texto final e aprova (ou
  reprova com um motivo, que o cliente vê no painel dele).
- No painel do cliente, o **deck** mostra os imóveis cruzando o que cada um
  procura (pontuação de mão dupla). Arrastou para a direita / tocou na chave =
  interesse.
- **Match**: quando os dois lados curtem, a **chave dourada se abre** para os
  clientes — e o match aparece em **Permutas → Matches** com os contatos para a
  equipe intermediar (os clientes não veem o contato um do outro).
- Curtidas em imóveis da carteira viram **Permutas → Interesses**, onde o
  corretor pode **Aceitar a permuta** em nome do proprietário (a chave abre
  para o cliente) ou recusar.

## Acesso da equipe (senha)

Defina a variável `DASHBOARD_SENHA` (no `.env` ou no ambiente) e o painel
passa a pedir uma senha única da equipe em `/entrar`. As páginas públicas
(`/permutas`), os feeds dos portais e as fotos continuam abertos. Sem a
variável, o sistema fica aberto (modo desenvolvimento).

## Colocar no ar de graça (Oracle Cloud)

Siga o guia **[deploy/LEIA-ME.md](deploy/LEIA-ME.md)**: conta gratuita da
Oracle (servidor em São Paulo), endereço de teste gratuito (DuckDNS) e
instalação com um único comando — já com HTTPS, senha da equipe, backups
diários e os utilitários `fc-atualizar` e `fc-dominio` (para quando chegar
o domínio oficial).

## Hospedagem (produção)

O sistema usa SQLite (`prisma/dev.db`) e grava fotos/vídeos em `storage/` —
ideal para um servidor próprio ou VPS simples:

```bash
npm run build
npm start   # porta 3000 (use um proxy com HTTPS na frente, ex.: nginx/caddy)
```

- Faça backup periódico de `prisma/dev.db` e da pasta `storage/`.
- Atrás de nginx, permita uploads grandes: `client_max_body_size 210m`.
- Se a marca d'água em TEXTO sair em branco (sem logo configurado), instale
  fontes no servidor: `apt install fontconfig fonts-dejavu`.
- Em **Configurações → Portais**, salve o domínio público (usado nos feeds).

## Próximos passos já previstos na arquitetura

- Login/perfis de corretor (o modelo já registra o corretor responsável).
- Site público completo de anúncios (os dados e a regra de privacidade de
  endereço já estão prontos).
- Integrações push com portais além do feed, e avisos por WhatsApp/e-mail
  (matches, aprovações, pedidos de endereço).
