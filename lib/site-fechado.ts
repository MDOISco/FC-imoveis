// Site público FECHADO por enquanto (pedido da dona, out/2026): todo o site
// pede a mesma senha do painel. Continuam livres só a tela de entrar, os
// feeds dos portais (com as fotos) e os links exclusivos de clientes (que já
// têm senha própria). Para reabrir: mudar para false aqui (ou pôr
// SITE_ABERTO=1 em /etc/fc-imoveis.env e reiniciar o serviço).
const FECHADO_NO_CODIGO = true;

export function siteFechado(): boolean {
  return FECHADO_NO_CODIGO && process.env.SITE_ABERTO !== "1";
}
