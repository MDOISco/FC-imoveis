#!/usr/bin/env bash
# =============================================================================
# FC Imóveis — instalador INTERATIVO (para consoles onde colar não funciona).
# Rode com:  curl -fsSL <link-curto> | bash
# Ele pergunta o endereço, a senha da equipe e se carrega a demonstração,
# e então executa o instalador completo (deploy/instalar.sh).
# =============================================================================
set -euo pipefail

BRANCH="claude/happy-meitner-2lkcyr"
URL="https://raw.githubusercontent.com/MDOISco/FC-imoveis/$BRANCH/deploy/instalar.sh"

# Lê as respostas direto do teclado, mesmo quando o script chega por "curl | bash"
exec < /dev/tty

echo ""
echo "============================================"
echo "   Instalador FC Imóveis — vamos lá! 🏡"
echo "============================================"
echo ""
read -r -p "1) Endereco do site (ex.: fcimoveis.duckdns.org): " DOMINIO
while [[ -z "${DOMINIO// /}" ]]; do
  read -r -p "   Digite o endereco: " DOMINIO
done

read -r -p "2) Senha da equipe (o que os corretores vao digitar): " SENHA
while [[ -z "$SENHA" ]]; do
  read -r -p "   Digite a senha: " SENHA
done

read -r -p "3) Carregar imoveis de demonstracao? (s/n): " DEMO
EXTRA=""
case "$(echo "${DEMO:-n}" | tr '[:upper:]' '[:lower:]')" in
  s|sim|y|yes) EXTRA="--demo" ;;
esac

echo ""
echo "Confirmando:"
echo "  Site:  https://$DOMINIO"
echo "  Demo:  $([[ -n "$EXTRA" ]] && echo sim || echo nao)"
read -r -p "Pode comecar? (s/n): " OK
case "$(echo "${OK:-n}" | tr '[:upper:]' '[:lower:]')" in
  s|sim|y|yes) ;;
  *) echo "Cancelado. Rode de novo quando quiser."; exit 0 ;;
esac

echo ""
curl -fsSL "$URL" -o /tmp/fc-instalar.sh
bash /tmp/fc-instalar.sh "$DOMINIO" "$SENHA" $EXTRA
