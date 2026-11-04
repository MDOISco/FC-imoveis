#!/usr/bin/env bash
# =============================================================================
# FC Imóveis — atualizar produção com segurança (sudo fc-atualizar)
#
# Por que este arquivo existe (nov/2026): a 1ª versão do fc-atualizar rodava
# `npm run build` com o site no ar e, se o build falhasse no meio, o site
# ficava QUEBRADO (HTML de um build procurando os arquivos de outro) e o
# comando parava sem reiniciar nada. Agora:
#   - o build que está no ar é guardado antes (.next-anterior) e VOLTA
#     sozinho se o build novo falhar;
#   - cada passo explica em português o que deu errado;
#   - o atalho /usr/local/bin/fc-atualizar passa a apontar para este arquivo,
#     então melhorias futuras chegam junto com o `git pull`.
# =============================================================================
set -u

# A pasta do app é a de cima desta (deploy/..) — normalmente /opt/fc-imoveis
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICO="fc-imoveis"

diga() { echo ""; echo "==> $*"; }
falha() {
  echo ""
  echo "❌ $*" >&2
  exit 1
}

[[ $(id -u) -eq 0 ]] || falha "Rode com sudo: sudo fc-atualizar"
cd "$DIR"

# Regrava o atalho apontando para este script (igual ao fc-dominio)
cat > /usr/local/bin/fc-atualizar <<FIM
#!/usr/bin/env bash
exec bash $DIR/deploy/atualizar.sh "\$@"
FIM
chmod +x /usr/local/bin/fc-atualizar

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
diga "[1/4] Baixando a versão nova do GitHub (branch $BRANCH)…"
git pull --ff-only origin "$BRANCH" \
  || falha "Não consegui baixar do GitHub. Confira a internet da VM e a mensagem acima; se falar em 'local changes', chame o suporte antes de apagar qualquer coisa."

diga "[2/4] Instalando dependências…"
npm ci || falha "O 'npm ci' falhou — veja a mensagem acima (pode ser internet ou disco cheio: 'df -h' mostra o espaço)."

# Guarda o build que está no ar para poder voltar se o novo falhar
rm -rf .next-anterior
[[ -d .next ]] && mv .next .next-anterior

diga "[3/4] Gerando o build novo (alguns minutos — não feche o terminal)…"
if ! npm run build; then
  echo ""
  echo "⚠️  O build falhou — voltando para a versão que estava no ar…"
  rm -rf .next
  [[ -d .next-anterior ]] && mv .next-anterior .next
  systemctl restart "$SERVICO"
  falha "O site voltou como estava (nada mudou). Rode 'sudo fc-atualizar' de novo; se falhar outra vez, mande as linhas de erro acima para quem cuida do sistema."
fi

diga "[4/4] Aplicando o banco e reiniciando o site…"
systemctl stop "$SERVICO"
if ! npx prisma migrate deploy; then
  echo ""
  echo "⚠️  A migração do banco falhou — voltando para a versão anterior…"
  rm -rf .next
  [[ -d .next-anterior ]] && mv .next-anterior .next
  systemctl start "$SERVICO"
  falha "O site voltou ao ar na versão antiga. Mande as linhas de erro acima para quem cuida do sistema."
fi
systemctl start "$SERVICO"
rm -rf .next-anterior

diga "✅ Atualizado! Abra o site e recarregue com Ctrl+F5 (no celular, feche e abra o navegador)."
