# FC Imóveis — contexto do projeto (leia antes de mexer)

Sistema da imobiliária **FC Imóveis** (Bragança Paulista/SP), dos corretores
**Cátia e Francisco** (o "FC" do nome — são só esses dois). A dona do projeto
não é programadora: respostas em **português simples**, sem jargão, passo a
passo curto. Decisões técnicas: explicar em 1 frase e seguir.

## O que é

- **Dashboard interno** (`/`, protegido por senha única da equipe): cadastro
  de imóveis em wizard de 8 etapas, fotos com tratamento + marca d'água,
  vídeo, 3 descrições geradas (templates determinísticos ou IA), publicação
  automática nos portais via feeds XML VRSync, gestão de permutas.
- **Permutas** (`/permutas`, público): cliente cadastra o próprio imóvel
  (vai para aprovação da equipe), deck estilo Tinder; no match mútuo abre a
  **chave dourada** (animação). Equipe intermedia; contatos só no dashboard.
- **Cadastro do cliente** (`/permutas/cadastrar`) cobre 3 objetivos:
  Trocar (permuta), Vender e Alugar — venda/locação pula a etapa de troca e
  vai à fila da equipe (sem deck). `objetivoDoImovel()` em lib/constants.ts.
- **Agendar visitas** (`/agendar`, público; `/agenda`, equipe): grade de
  horários em fuso de Brasília (lib/agenda/slots.ts — USE listarDias/conflita,
  não reinvente fuso), slot revalidado no servidor, arquivo .ics
  (lib/agenda/ics.ts). Google Agenda/e-mail entram em **lib/notify.ts**.
- **Bate-papo ao vivo** (widget nas páginas públicas; `/conversas` na equipe):
  ChatThread/ChatMessage, polling leve (sem lib externa), bolinha de não lidas.
- **Mapa da cidade** (`/cidade`): Leaflet + OpenStreetMap (sem chave), pontos
  reais em lib/cidade/pontos.ts. Componente só-cliente (Leaflet usa window).
- **Site público** (`/site`, prévia com noindex): página do imóvel em
  `/site/imovel/[id]` só para imóvel ATIVO + "Publicar no site" ligado na
  ficha. **Link exclusivo** (`/exclusivo/[token]`, senha por cliente criada na
  ficha; só o HMAC fica no banco; sem menu, sem acesso ao resto do site).
- **Atividade** (`/atividade`, equipe): registro das visitas às páginas do
  imóvel (link exclusivo identificado pelo nome do cliente; site anônimo):
  tempo com a aba visível, rolagem, cidade aproximada pelo IP (ipwho.is,
  sem chave, falha silenciosa), cliques (WhatsApp, Agendar, fotos, vídeo) e
  seções vistas. Modelos Visit/VisitEvent; rota pública `/api/atividade`
  (abrir/pulso/evento); componente `RastreioAtividade` + marcações
  `data-atividade`/`data-secao` em imovel-detalhes/galeria. Equipe logada
  não conta; recarregar em < 30 min continua a mesma visita. **Nunca**
  guardar IP nem navegador. A lista não atualiza sozinha (decisão da dona).
- Feito para corretores de mais idade: **letras grandes (base 18px), botões
  grandes, pt-BR em toda a UI**. Manter esse padrão em qualquer tela nova.
- **Imóvel de cliente (source=LEAD) tem gestão própria** (Permutas → Imóveis
  de clientes): NUNCA operar status/edição pela ficha/wizard do corretor —
  as rotas /api/imoveis bloqueiam source=LEAD de propósito (regressão do bug 1).

## Produção (está NO AR)

- URL: **https://fcimoveis.duckdns.org** (DuckDNS aponta para a VPS KVM1 da
  Hostinger; domínio oficial virá depois — trocar com `sudo fc-dominio`).
- Servidor Ubuntu 22.04; app em `/opt/fc-imoveis` como serviço systemd
  `fc-imoveis` (porta 3000) atrás do **Caddy** (HTTPS automático; no servidor
  atual o Caddy é binário em `/usr/local/bin/caddy` porque o repositório apt
  estava fora do ar). Senha/segredo em `/etc/fc-imoveis.env` (600).
- **Atualizar produção** = commit + push aqui e, no servidor,
  `sudo fc-atualizar` (git pull, build, migrate com o serviço parado,
  restart). Backups diários em `/var/backups/fc-imoveis`.
- Instalador completo e idempotente: `deploy/instalar.sh` (guia em
  `deploy/LEIA-ME.md`). `deploy/fc.sh` = atalho zero-decisões.
- O repositório é **PÚBLICO**: nunca commitar senhas, chaves ou dados reais.

## Stack e regras que já quebraram a cara (não repetir)

- Next.js 15 App Router + React 19 + TS; `params`/`searchParams` são
  **Promises** (sempre `await`).
- Tailwind **v4 CSS-first**: tokens em `@theme` no `app/globals.css`
  (`--color-brand-*` verde, `--color-gold-*` dourado). **Nunca** montar
  classe dinâmica (`bg-${x}`). Trocar o tema = trocar os tokens desse
  arquivo (a dona pretende pedir isso).
- **Logo**: PNGs com fundo transparente em `public/logo/` (componente
  `components/layout/logo.tsx`; ícone da aba em `app/icon.png`). A arte
  original tem linhas marrom-escuras que somem no verde-escuro: nos
  cabeçalhos e no login usar as versões `-fundo-escuro` (linhas douradas).
  **Nunca** pôr quadrado/fundo branco atrás do logo (pedido da dona).
- Prisma **6** e TypeScript **5 pinados** (não subir para Prisma 7 / TS 7).
  SQLite com WAL + busy_timeout; enums como constantes TS em
  `lib/constants.ts` (tokens pt-BR). Dinheiro em **reais inteiros** (Int).
- `prisma migrate` em produção só com o serviço parado (SQLite trava).
- Fotos: sharp a partir do **original** preservado; servidas por
  `/api/arquivos/...` (nunca `public/`). Vídeo: PUT raw stream (nunca
  formData). Imóveis de clientes (source=LEAD) **nunca** entram nos feeds.
- **Privacidade de endereço (regra da casa)**: público só vê cidade/bairro;
  rua/número/CEP jamais em página pública ou feed (displayAddress).
- Descrições por IA: `client.messages.parse()` com modelo
  **claude-opus-5-5** + zodOutputFormat; qualquer erro → fallback silencioso
  para os templates. Chave fica em Settings (mascarada no GET).
- Branch de trabalho e padrão do repositório: `claude/happy-meitner-2lkcyr`
  (o repositório nasceu vazio; essa é a branch principal).

## Pendências conhecidas

- Trocar para o domínio oficial quando chegar (Hostinger) + atualizar
  "Endereço público do sistema" em Configurações → Portais.
- Cadastrar os feeds nos painéis dos portais (Canal Pro, Chaves na Mão,
  Imovelweb) — de preferência já com o domínio oficial.
- Possíveis próximos passos já previstos: login por corretor, site público
  completo, avisos WhatsApp/e-mail, Termos de Uso/LGPD da página de permutas.
