#!/usr/bin/env bash
# =============================================================================
# FC Imóveis — atualizar produção com segurança (sudo fc-atualizar)
#
# Ordem dos passos (ela importa — lição de nov/2026):
#   1. git pull               baixa a versão nova
#   2. npm ci                 instala as dependências
#   3. PARA o site            (o SQLite não aceita migração com o site no ar)
#   4. prisma migrate deploy  atualiza o banco
#   5. next build             monta o site novo
#   6. INICIA o site          (fora do ar só entre 3 e 6: uns minutos)
#
# Por que o banco vem ANTES do build: o build monta páginas que leem o banco
# (o layout do site público lê Configurações). Quando a versão nova trazia
# uma coluna nova, o build quebrava no meio — e o `next build` já tinha
# apagado os arquivos da versão antiga, então o site ficava no ar sem eles:
# "Application error: a client-side exception" em toda página. A 1ª versão
# do fc-atualizar fazia build → migrate e parava aí, sem avisar.
#
# Segurança: o build que estava no ar é guardado (.next-anterior) e VOLTA
# sozinho se qualquer passo falhar; cada passo explica em português o que
# deu errado; o atalho /usr/local/bin/fc-atualizar passa a apontar para este
# arquivo, então melhorias futuras chegam junto com o `git pull`.
# =============================================================================
set -u

# A pasta do app é a de cima desta (deploy/..) — normalmente /opt/fc-imoveis
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICO="fc-imoveis"
ANTERIOR="$DIR/.next-anterior"

diga() { echo ""; echo "==> $*"; }
falha() {
  echo ""
  echo "❌ $*" >&2
  exit 1
}
# Devolve o build que estava no ar (se foi guardado) e liga o site de novo.
voltar() {
  if [[ -d "$ANTERIOR" ]]; then
    rm -rf "$DIR/.next"
    mv "$ANTERIOR" "$DIR/.next"
  fi
  systemctl start "$SERVICO" || true
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
diga "[1/6] Baixando a versão nova do GitHub (branch $BRANCH)…"
git pull --ff-only origin "$BRANCH" \
  || falha "Não consegui baixar do GitHub. Confira a internet da VM e a mensagem acima; se falar em 'local changes', chame o suporte antes de apagar qualquer coisa. O site continua como estava."

diga "[2/6] Instalando dependências…"
npm ci --no-audit --no-fund \
  || falha "O 'npm ci' falhou — veja a mensagem acima (pode ser internet ou disco cheio: 'df -h' mostra o espaço). O site continua como estava."

diga "[3/6] Parando o site (fica fora do ar só durante a atualização)…"
systemctl stop "$SERVICO" || falha "Não consegui parar o serviço $SERVICO. Veja: sudo systemctl status $SERVICO"

diga "[4/6] Atualizando o banco de dados…"
if ! npx prisma migrate deploy; then
  echo ""
  echo "⚠️  A atualização do banco falhou — ligando o site de novo na versão anterior…"
  voltar
  falha "O site voltou ao ar como estava (nada mudou). Mande as linhas de erro acima para quem cuida do sistema."
fi

diga "[5/6] Montando o site novo (alguns minutos — não feche o terminal)…"
# Guarda o build que estava no ar para poder voltar se o novo falhar.
# O cache (só acelera o build) vai para o build novo.
rm -rf "$ANTERIOR"
if [[ -d .next ]]; then
  mv .next "$ANTERIOR"
  mkdir .next
  [[ -d "$ANTERIOR/cache" ]] && mv "$ANTERIOR/cache" .next/cache
fi
if ! npm run build; then
  echo ""
  echo "⚠️  O build falhou — voltando para a versão que estava no ar…"
  voltar
  falha "O site voltou ao ar como estava. Rode 'sudo fc-atualizar' de novo; se falhar outra vez, mande as linhas de erro acima para quem cuida do sistema."
fi

diga "[6/6] Ligando o site…"
systemctl start "$SERVICO" || falha "Não consegui ligar o serviço $SERVICO. Veja: sudo systemctl status $SERVICO"
sleep 3
if ! systemctl is-active --quiet "$SERVICO"; then
  echo ""
  echo "⚠️  O site não ficou no ar com a versão nova — voltando para a anterior…"
  systemctl stop "$SERVICO" >/dev/null 2>&1 || true
  voltar
  falha "O site voltou ao ar como estava. Veja o motivo com: sudo journalctl -u $SERVICO -n 50"
fi
rm -rf "$ANTERIOR"

diga "✅ Atualizado! ($(git log -1 --format='%h · %s'))"
echo "    Abra o site e recarregue com Ctrl+F5 (no celular, feche e abra o navegador)."
