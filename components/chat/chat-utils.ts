// Tipos e helpers do bate-papo usados SÓ em componentes client
// (horários formatados no navegador — nada de hidratação divergente).

export type ChatMensagem = {
  id: string;
  de: "CLIENTE" | "EQUIPE";
  texto: string;
  criadaEm: string; // ISO
};

export type ChatStatus = "ABERTO" | "ENCERRADO";

export const CHAT_STATUS_LABELS: Record<string, string> = {
  ABERTO: "Aberta",
  ENCERRADO: "Encerrada",
};

// Classes completas (nunca montar classe Tailwind dinamicamente)
export const CHAT_STATUS_BADGE_CLASSES: Record<string, string> = {
  ABERTO: "bg-brand-100 text-brand-900",
  ENCERRADO: "bg-stone-200 text-stone-700",
};

const horaSP = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});
const diaHoraSP = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
const diaChaveSP = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** "14:32" se a mensagem é de hoje; "11/10, 14:32" se é de outro dia. */
export function horaMensagem(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return diaChaveSP.format(d) === diaChaveSP.format(new Date())
    ? horaSP.format(d)
    : diaHoraSP.format(d);
}

/** Junta mensagens novas sem duplicar (o polling pode repetir) mantendo a ordem. */
export function juntarMensagens(
  atuais: ChatMensagem[],
  novas: ChatMensagem[],
): ChatMensagem[] {
  if (novas.length === 0) return atuais;
  const porId = new Map(atuais.map((m) => [m.id, m]));
  let mudou = false;
  for (const m of novas) {
    if (!porId.has(m.id)) {
      porId.set(m.id, m);
      mudou = true;
    }
  }
  if (!mudou) return atuais;
  return [...porId.values()].sort((a, b) =>
    a.criadaEm === b.criadaEm
      ? a.id.localeCompare(b.id)
      : a.criadaEm.localeCompare(b.criadaEm),
  );
}
