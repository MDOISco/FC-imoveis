#!/usr/bin/env bash
# FC Imóveis — troca o domínio do sistema (ex.: fcimoveis.com.br).
#
#   sudo bash /opt/fc-imoveis/deploy/dominio.sh fcimoveis.com.br
#   (depois da 1ª vez, basta: sudo fc-dominio fcimoveis.com.br)
#
# O que faz:
#   1. Confere se o DNS do domínio já aponta para ESTE servidor (senão para,
#      a menos que use --forcar).
#   2. Reescreve o Caddy: domínio novo com HTTPS; "www.dominio" e TODOS os
#      endereços antigos (ex.: fcimoveis.duckdns.org) redirecionam para ele.
#   3. Atualiza APP_URL e o "Endereço público do sistema" (Configurações).
#   4. Reinicia sistema + Caddy. Nenhum dado é apagado.
set -euo pipefail

NOVO="${1:-}"
FORCAR="${2:-}"
ENV_FILE=/etc/fc-imoveis.env
CADDYFILE=/etc/caddy/Caddyfile
DB=/opt/fc-imoveis/prisma/dev.db

if [[ $EUID -ne 0 ]]; then echo "Rode com sudo." >&2; exit 1; fi
# Aceita "https://www.fcimoveis.com.br/" e similares: fica só fcimoveis.com.br
NOVO="$(printf '%s' "$NOVO" | tr 'A-Z' 'a-z' | sed -e 's|^https\?://||' -e 's|/.*$||' -e 's|^www\.||')"
if [[ -z "$NOVO" || ! "$NOVO" =~ ^[a-z0-9.-]+\.[a-z]{2,}$ ]]; then
  echo "Uso: sudo fc-dominio fcimoveis.com.br [--forcar]" >&2
  exit 1
fi

CADDY_BIN="$(command -v caddy || echo /usr/local/bin/caddy)"

echo "==> Conferindo o DNS de $NOVO"
IP_SERVIDOR="$(curl -4 -fsS --max-time 10 https://api.ipify.org 2>/dev/null || true)"
IP_DOMINIO="$(getent ahostsv4 "$NOVO" 2>/dev/null | awk 'NR==1{print $1}' || true)"
echo "    IP deste servidor: ${IP_SERVIDOR:-não consegui descobrir}"
echo "    $NOVO aponta para: ${IP_DOMINIO:-ainda não aponta para nada}"
if [[ -n "$IP_SERVIDOR" && "$IP_DOMINIO" != "$IP_SERVIDOR" && "$FORCAR" != "--forcar" ]]; then
  echo ""
  echo "  ⚠ O domínio ainda NÃO aponta para este servidor."
  echo "    No Registro.br, crie o registro A de $NOVO com o IP $IP_SERVIDOR"
  echo "    e espere alguns minutos (às vezes até 2 horas). Depois rode de novo."
  echo "    (Para trocar mesmo assim: sudo fc-dominio $NOVO --forcar)"
  exit 1
fi

# Endereços que o Caddy já atende hoje (ex.: fcimoveis.duckdns.org): viram
# redirecionamento para o domínio novo, para os links antigos não quebrarem.
ANTIGOS=""
if [[ -f "$CADDYFILE" ]]; then
  ANTIGOS="$(grep -E '^[^[:space:]#{}][^[:space:]]*[[:space:]]*\{' "$CADDYFILE" \
    | sed -e 's/[[:space:]]*{.*$//' -e 's/,/ /g' | tr ' ' '\n' \
    | grep -v -x -e '' -e "$NOVO" -e "www.$NOVO" | sort -u | tr '\n' ' ' || true)"
fi

echo "==> Configurando HTTPS (Caddy)"
cp -a "$CADDYFILE" "$CADDYFILE.antes-dominio" 2>/dev/null || true
{
  cat <<EOF
$NOVO {
    reverse_proxy localhost:3000
    request_body {
        max_size 210MB
    }
}

www.$NOVO {
    redir https://$NOVO{uri} permanent
}
EOF
  for antigo in $ANTIGOS; do
    printf '\n%s {\n    redir https://%s{uri} permanent\n}\n' "$antigo" "$NOVO"
  done
} > "$CADDYFILE"

if ! "$CADDY_BIN" validate --config "$CADDYFILE" --adapter caddyfile >/dev/null 2>&1; then
  echo "  ✖ Configuração do Caddy inválida — voltando a anterior." >&2
  cp -a "$CADDYFILE.antes-dominio" "$CADDYFILE" 2>/dev/null || true
  exit 1
fi

echo "==> Atualizando o endereço do sistema"
sed -i "s|^APP_URL=.*|APP_URL=\"https://$NOVO\"|" "$ENV_FILE"
# "Endereço público do sistema" (Configurações → Portais), se estiver preenchido
if command -v sqlite3 >/dev/null 2>&1 && [[ -f "$DB" ]]; then
  sqlite3 -cmd ".timeout 5000" "$DB" \
    "UPDATE Settings SET publicBaseUrl='https://$NOVO' WHERE publicBaseUrl IS NOT NULL AND publicBaseUrl <> '';" \
    || echo "  (não consegui atualizar Configurações → Portais; ajuste lá à mão)"
fi

# Deixa o atalho "fc-dominio" usando sempre este script (versão do GitHub)
cat > /usr/local/bin/fc-dominio <<'EOF'
#!/usr/bin/env bash
exec bash /opt/fc-imoveis/deploy/dominio.sh "$@"
EOF
chmod +x /usr/local/bin/fc-dominio

systemctl restart fc-imoveis caddy

echo ""
echo "============================================================"
echo "  ✅ Domínio trocado!"
echo ""
echo "  Site (público):        https://$NOVO"
echo "  Painel dos corretores: https://$NOVO/painel  (com senha)"
[[ -n "$ANTIGOS" ]] && echo "  Endereços antigos que agora levam ao novo: $ANTIGOS"
echo ""
echo "  O cadeado (HTTPS) pode levar 1 a 2 minutos na 1ª vez."
echo "============================================================"
