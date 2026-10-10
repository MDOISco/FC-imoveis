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
# O script é idempotente: pode rodar de novo para atualizar.
# =============================================================================
set -euo pipefail

DOMINIO="${1:-}"
SENHA="${2:-}"
DEMO="${3:-}"
REPO="https://github.com/MDOISco/FC-imoveis.git"
BRANCH="claude/happy-meitner-2lkcyr"
DIR="/opt/fc-imoveis"

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
apt-get update -y
apt-get install -y curl git ca-certificates gnupg fontconfig fonts-dejavu-core \
  debian-keyring debian-archive-keyring apt-transport-https

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
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y && apt-get install -y caddy
fi

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
npx prisma migrate deploy
if [[ "$DEMO" == "--demo" ]]; then
  echo "==> Carregando dados de demonstração"
  npx prisma db seed || true
fi
npm run build

echo "==> [6/8] Serviço do sistema (systemd)"
cat > /etc/systemd/system/fc-imoveis.service <<EOF
[Unit]
Description=FC Imoveis (Next.js)
After=network.target

[Service]
WorkingDirectory=$DIR
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=APP_URL=https://$DOMINIO
Environment=DASHBOARD_SENHA=$SENHA
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
cat > /etc/cron.daily/fc-imoveis-backup <<'EOF'
#!/usr/bin/env bash
set -e
DIR=/opt/fc-imoveis
DEST=/var/backups/fc-imoveis
mkdir -p "$DEST"
tar -czf "$DEST/backup-$(date +%F).tar.gz" -C "$DIR" prisma/dev.db storage 2>/dev/null || true
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
npx prisma migrate deploy
npm run build
systemctl restart fc-imoveis
echo "Atualizado!"
EOF
chmod +x /usr/local/bin/fc-atualizar

# fc-dominio: troca o domínio (ex.: quando chegar o domínio da Hostinger)
cat > /usr/local/bin/fc-dominio <<'EOF'
#!/usr/bin/env bash
set -e
NOVO="$1"
if [[ -z "$NOVO" ]]; then echo "Uso: fc-dominio novo.dominio.com.br"; exit 1; fi
sed -i "1s/.*/$NOVO {/" /etc/caddy/Caddyfile
sed -i "s|^Environment=APP_URL=.*|Environment=APP_URL=https://$NOVO|" /etc/systemd/system/fc-imoveis.service
systemctl daemon-reload
systemctl restart fc-imoveis caddy
echo "Domínio trocado para https://$NOVO (lembre de apontar o DNS para este servidor)."
EOF
chmod +x /usr/local/bin/fc-dominio

echo ""
echo "============================================================"
echo "  ✅ FC Imóveis instalado!"
echo ""
echo "  Painel da equipe:  https://$DOMINIO  (senha configurada)"
echo "  Permutas (público): https://$DOMINIO/permutas"
echo ""
echo "  Comandos úteis:"
echo "    sudo fc-atualizar              # instala a versão mais nova"
echo "    sudo fc-dominio novo.dominio   # troca o domínio depois"
echo "    sudo systemctl status fc-imoveis"
echo ""
echo "  Backups diários em /var/backups/fc-imoveis"
echo "============================================================"
