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
- Feito para corretores de mais idade: **letras grandes (base 18px), botões
  grandes, pt-BR em toda a UI**. Manter esse padrão em qualquer tela nova.

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
