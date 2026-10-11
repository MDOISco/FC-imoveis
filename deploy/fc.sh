#!/usr/bin/env bash
# =============================================================================
# FC Imóveis — instalador "zero decisões" para fcimoveis.duckdns.org.
# Rode com:  curl -fsSL <link-curto> | bash
# Só pergunta a senha da equipe; o resto já está definido.
# =============================================================================
set -euo pipefail

DOMINIO="fcimoveis.duckdns.org"
BRANCH="claude/happy-meitner-2lkcyr"
URL="https://raw.githubusercontent.com/MDOISco/FC-imoveis/$BRANCH/deploy/instalar.sh"

exec < /dev/tty

echo ""
echo "================================================="
echo "  Instalador FC Imóveis  →  https://$DOMINIO"
echo "================================================="
echo ""
read -r -p "Digite a SENHA DA EQUIPE e aperte Enter: " SENHA
while [[ -z "$SENHA" ]]; do
  read -r -p "A senha não pode ficar vazia. Digite a senha: " SENHA
done

echo ""
echo "Instalando... (5 a 10 minutos — não feche esta janela)"
echo ""
curl -fsSL "$URL" -o /tmp/fc-instalar.sh
bash /tmp/fc-instalar.sh "$DOMINIO" "$SENHA" --demo
