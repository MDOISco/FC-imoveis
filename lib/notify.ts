// Ponto ÚNICO de avisos do sistema.
// Hoje: registra no log do servidor (journalctl -u fc-imoveis).
// Depois: a sincronização com o Google Agenda da Cátia/Francisco e os avisos
// por e-mail entram AQUI, sem mexer em nenhuma outra parte do código.
export async function notificar(
  evento:
    | "agendamento.criado"
    | "agendamento.cancelado"
    | "agendamento.confirmado"
    | "chat.nova_conversa"
    | "cadastro.recebido",
  dados: Record<string, unknown>,
): Promise<void> {
  try {
    console.log(`[aviso] ${evento} ${JSON.stringify(dados)}`);
    // TODO (integrações futuras):
    // - Google Agenda: criar/cancelar evento na agenda do corretor responsável
    // - E-mail: avisar equipe e cliente (confirmação, lembrete, cancelamento)
  } catch {
    // aviso nunca pode derrubar a ação principal
  }
}
