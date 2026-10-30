#!/usr/bin/env bash
# =============================================================================
# FC Imóveis — instalador de produção (Ubuntu 22.04/24.04, x86 ou ARM)
#
# Uso (como root, na VM):
#   curl -fsSL https://raw.githubusercontent.com/MDOISco/FC-imoveis/claude/happy-meitner-2lkcyr/deploy/instalar.sh \
#     | sudo bash -s -- SEU.DOMINIO.COM "SENHA-DA-EQUIPE" [--demo]
#
#   SEU.DOMINIO.COM   domínio apontado para esta VM (ex.: fcimoveis.duckdns.org)
#   SENHA-DA-EQUIPE   senha única que os corretores usarão para entrar
#   --demo            (opcional) carrega os dados de demonstração
#
# Variáveis opcionais: FC_BRANCH=nome-da-branch (padrão: branch principal
# do repositório no GitHub).
# O script é idempotente: pode rodar de novo para atualizar.
# =============================================================================
set -euo pipefail

DOMINIO="${1:-}"
SENHA="${2:-}"
DEMO="${3:-}"
REPO="https://github.com/MDOISco/FC-imoveis.git"
DIR="/opt/fc-imoveis"
ENV_FILE="/etc/fc-imoveis.env"

if [[ -z "$DOMINIO" || -z "$SENHA" ]]; then
  echo "Uso: instalar.sh SEU.DOMINIO.COM \"SENHA-DA-EQUIPE\" [--demo]" >&2
  exit 1
fi
if [[ $(id -u) -ne 0 ]]; then
  echo "Rode como root (use sudo)." >&2
  exit 1
fi

echo "==> [1/8] Pacotes básicos"
export DEBIAN_FRONTEND=noninteractive
# Se uma execução anterior deixou o repositório do Caddy quebrado (fora do
# ar), tira da lista para não travar o apt; o passo 4 tenta de novo.
if [[ -f /etc/apt/sources.list.d/caddy-stable.list ]] && ! command -v caddy >/dev/null; then
  rm -f /etc/apt/sources.list.d/caddy-stable.list
fi
apt-get update -y
apt-get install -y curl git ca-certificates gnupg sqlite3 fontconfig \
  fonts-dejavu-core debian-keyring debian-archive-keyring apt-transport-https

# Branch: a informada em FC_BRANCH ou a principal do repositório
BRANCH="${FC_BRANCH:-$(git ls-remote --symref "$REPO" HEAD 2>/dev/null \
  | awk '/^ref:/ { sub("refs/heads/", "", $2); print $2 }')}"
BRANCH="${BRANCH:-main}"
echo "    branch: $BRANCH"

echo "==> [2/8] Liberando portas 80/443 no firewall da VM (padrão Oracle)"
if command -v iptables >/dev/null; then
  for porta in 80 443; do
    iptables -C INPUT -p tcp --dport "$porta" -j ACCEPT 2>/dev/null \
      || iptables -I INPUT 1 -p tcp --dport "$porta" -j ACCEPT
  done
  apt-get install -y iptables-persistent >/dev/null 2>&1 || true
  command -v netfilter-persistent >/dev/null && netfilter-persistent save || true
fi

echo "==> [3/8] Node.js 20"
if ! command -v node >/dev/null || [[ "$(node -v | cut -c2-3)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> [4/8] Caddy (HTTPS automático)"
if ! command -v caddy >/dev/null; then
  # 1ª tentativa: repositório oficial (apt). Se estiver fora do ar (ex.: 402
  # do cloudsmith), cai para o binário oficial baixado do site do Caddy.
  (
    set -e
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
      | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
      > /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -y
    apt-get install -y caddy
  ) || true
fi
if ! command -v caddy >/dev/null; then
  echo "    repositório do Caddy indisponível — baixando o binário oficial"
  rm -f /etc/apt/sources.list.d/caddy-stable.list
  ARCH="$(dpkg --print-architecture)"   # amd64 ou arm64
  curl -fsSL -o /usr/local/bin/caddy.novo \
    "https://caddyserver.com/api/download?os=linux&arch=${ARCH}"
  chmod +x /usr/local/bin/caddy.novo
  /usr/local/bin/caddy.novo version >/dev/null   # confere que o binário roda
  mv /usr/local/bin/caddy.novo /usr/local/bin/caddy
fi
mkdir -p /etc/caddy
# Serviço do systemd (o pacote apt já traz o dele; criamos só se não existir)
if [[ ! -f /lib/systemd/system/caddy.service && ! -f /etc/systemd/system/caddy.service ]]; then
  CADDY_BIN="$(command -v caddy)"
  cat > /etc/systemd/system/caddy.service <<EOF
[Unit]
Description=Caddy (HTTPS automatico)
After=network.target network-online.target
Wants=network-online.target

[Service]
ExecStart=$CADDY_BIN run --config /etc/caddy/Caddyfile
ExecReload=$CADDY_BIN reload --config /etc/caddy/Caddyfile --force
Restart=always
RestartSec=5
User=root
LimitNOFILE=1048576

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
fi
systemctl enable caddy >/dev/null 2>&1 || true

echo "==> [5/8] Código do sistema"
if [[ -d "$DIR/.git" ]]; then
  git -C "$DIR" fetch origin "$BRANCH"
  git -C "$DIR" checkout "$BRANCH"
  git -C "$DIR" pull --ff-only origin "$BRANCH"
else
  git clone --branch "$BRANCH" "$REPO" "$DIR"
fi
cd "$DIR"
npm ci
npm run build
# Migração com o serviço parado: o SQLite trava se o sistema estiver no ar
# (acontece ao rodar o instalador de novo para atualizar/consertar).
systemctl stop fc-imoveis >/dev/null 2>&1 || true
npx prisma migrate deploy
if [[ "$DEMO" == "--demo" ]]; then
  echo "==> Carregando dados de demonstração"
  npx prisma db seed || true
fi

echo "==> [6/8] Variáveis e serviço do sistema (systemd)"
# Arquivo de ambiente com permissão 600 (só root lê). Valores entre aspas
# duplas com \ e " escapados — aceita qualquer senha (espaços, %, etc.).
esc() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'; }
SEGREDO="$(grep -E '^DASHBOARD_SEGREDO=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"' || true)"
[[ -z "$SEGREDO" ]] && SEGREDO="$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
umask 077
cat > "$ENV_FILE" <<EOF
NODE_ENV=production
PORT=3000
APP_URL="https://$(esc "$DOMINIO")"
DASHBOARD_SENHA="$(esc "$SENHA")"
DASHBOARD_SEGREDO="$SEGREDO"
EOF
chmod 600 "$ENV_FILE"
umask 022

cat > /etc/systemd/system/fc-imoveis.service <<EOF
[Unit]
Description=FC Imoveis (Next.js)
After=network.target

[Service]
WorkingDirectory=$DIR
EnvironmentFile=$ENV_FILE
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
User=root

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable fc-imoveis
systemctl restart fc-imoveis

echo "==> [7/8] HTTPS e domínio ($DOMINIO)"
cat > /etc/caddy/Caddyfile <<EOF
$DOMINIO {
    reverse_proxy localhost:3000
    request_body {
        max_size 210MB
    }
}
EOF
systemctl restart caddy

echo "==> [8/8] Backup diário (banco + fotos) e utilitários"
# Backup consistente do SQLite (modo WAL) com .backup, depois as fotos.
cat > /etc/cron.daily/fc-imoveis-backup <<'EOF'
#!/usr/bin/env bash
set -e
DIR=/opt/fc-imoveis
DEST=/var/backups/fc-imoveis
TMP=$(mktemp -d)
mkdir -p "$DEST"
sqlite3 "$DIR/prisma/dev.db" ".backup '$TMP/dev.db'"
tar -czf "$DEST/backup-$(date +%F).tar.gz" -C "$TMP" dev.db -C "$DIR" storage 2>/dev/null || true
rm -rf "$TMP"
ls -1t "$DEST"/backup-*.tar.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
EOF
chmod +x /etc/cron.daily/fc-imoveis-backup

# fc-atualizar: puxa a versão nova do GitHub e reinicia
cat > /usr/local/bin/fc-atualizar <<EOF
#!/usr/bin/env bash
set -e
cd $DIR
git pull --ff-only origin $BRANCH
npm ci
npm run build
systemctl stop fc-imoveis
npx prisma migrate deploy
systemctl start fc-imoveis
echo "Atualizado!"
EOF
chmod +x /usr/local/bin/fc-atualizar

# fc-dominio: troca o domínio (confere o DNS, põe www e endereços antigos
# redirecionando para o novo) — a lógica fica em deploy/dominio.sh.
cat > /usr/local/bin/fc-dominio <<EOF
#!/usr/bin/env bash
exec bash $DIR/deploy/dominio.sh "\$@"
EOF
chmod +x /usr/local/bin/fc-dominio

# fc-senha: troca a senha da equipe
cat > /usr/local/bin/fc-senha <<'EOF'
#!/usr/bin/env bash
set -e
NOVA="$1"
if [[ -z "$NOVA" ]]; then echo "Uso: fc-senha \"NOVA-SENHA\""; exit 1; fi
ESC=$(printf '%s' "$NOVA" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')
sed -i "s|^DASHBOARD_SENHA=.*|DASHBOARD_SENHA=\"$ESC\"|" /etc/fc-imoveis.env
systemctl restart fc-imoveis
echo "Senha da equipe trocada. Todos precisarão entrar de novo."
EOF
chmod +x /usr/local/bin/fc-senha

echo ""
echo "============================================================"
echo "  ✅ FC Imóveis instalado!"
echo ""
echo "  Site (público):     https://$DOMINIO"
echo "  Painel da equipe:   https://$DOMINIO/painel  (senha configurada)"
echo ""
echo "  Comandos úteis:"
echo "    sudo fc-atualizar               # instala a versão mais nova"
echo "    sudo fc-dominio novo.dominio    # troca o domínio depois"
echo "    sudo fc-senha \"nova senha\"      # troca a senha da equipe"
echo "    sudo systemctl status fc-imoveis"
echo ""
echo "  Backups diários em /var/backups/fc-imoveis"
echo "============================================================"
