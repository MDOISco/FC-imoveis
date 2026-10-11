// Regras de horário das visitas/atendimentos.
// Tudo aqui pensa em HORÁRIO DE BRASÍLIA (America/Sao_Paulo, UTC-3 fixo desde
// 2019) e grava no banco em UTC. Quando o Google Agenda entrar, esta lib
// continua sendo a fonte das regras — só a sincronização muda (lib/notify.ts).

export const FUSO_SP = "America/Sao_Paulo";
const OFFSET_SP_MS = 3 * 60 * 60 * 1000; // SP = UTC-3 (sem horário de verão)

export const AGENDA_CONFIG = {
  diasHorizonte: 14, // até quantos dias à frente dá para agendar
  duracaoMin: 60, // cada visita ocupa 1 hora
  antecedenciaMinHoras: 3, // não deixa agendar em cima da hora
  // Janelas de atendimento por dia da semana (0=domingo ... 6=sábado),
  // em hora local de Brasília. null = sem atendimento.
  janelas: {
    0: null,
    1: ["09:00", "18:00"],
    2: ["09:00", "18:00"],
    3: ["09:00", "18:00"],
    4: ["09:00", "18:00"],
    5: ["09:00", "18:00"],
    6: ["09:00", "13:00"],
  } as Record<number, [string, string] | null>,
};

/** Constrói um Date (UTC) a partir de ano/mês/dia/hora/minuto em hora de SP. */
export function dataSP(
  ano: number,
  mes1a12: number,
  dia: number,
  hora = 0,
  minuto = 0,
): Date {
  return new Date(Date.UTC(ano, mes1a12 - 1, dia, hora, minuto) + OFFSET_SP_MS);
}

/** Partes (ano, mês, dia, hora, minuto, dia da semana) de um Date em hora de SP. */
export function partesSP(d: Date) {
  const l = new Date(d.getTime() - OFFSET_SP_MS);
  return {
    ano: l.getUTCFullYear(),
    mes: l.getUTCMonth() + 1,
    dia: l.getUTCDate(),
    hora: l.getUTCHours(),
    minuto: l.getUTCMinutes(),
    diaSemana: l.getUTCDay(),
  };
}

/** "2026-10-15" (data local SP) de um Date. */
export function chaveDiaSP(d: Date): string {
  const p = partesSP(d);
  return `${p.ano}-${String(p.mes).padStart(2, "0")}-${String(p.dia).padStart(2, "0")}`;
}

export type Ocupado = { startsAt: Date; endsAt: Date; brokerId: string | null };

export function conflita(
  inicio: Date,
  fim: Date,
  brokerId: string | null,
  ocupados: Ocupado[],
): boolean {
  return ocupados.some(
    (o) =>
      (o.brokerId ?? null) === (brokerId ?? null) &&
      inicio < o.endsAt &&
      fim > o.startsAt,
  );
}

export type Slot = { inicioISO: string; rotulo: string; disponivel: boolean };
export type DiaDeSlots = {
  chave: string; // "2026-10-15"
  rotulo: string; // "qua, 15/10"
  slots: Slot[];
};

const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/**
 * Lista os dias e horários agendáveis a partir de `agora`, já marcando como
 * indisponíveis os horários que conflitam com `ocupados` (mesmo corretor).
 */
export function listarDias(
  agora: Date,
  ocupados: Ocupado[],
  brokerId: string | null,
): DiaDeSlots[] {
  const minimo = new Date(
    agora.getTime() + AGENDA_CONFIG.antecedenciaMinHoras * 60 * 60 * 1000,
  );
  const dias: DiaDeSlots[] = [];
  const hoje = partesSP(agora);

  for (let i = 0; i < AGENDA_CONFIG.diasHorizonte; i++) {
    // meia-noite SP do dia `hoje + i`
    const base = dataSP(hoje.ano, hoje.mes, hoje.dia + i);
    const p = partesSP(base);
    const janela = AGENDA_CONFIG.janelas[p.diaSemana];
    if (!janela) continue;

    const [abre, fecha] = janela;
    const [hA, mA] = abre.split(":").map(Number);
    const [hF, mF] = fecha.split(":").map(Number);
    const slots: Slot[] = [];
    for (
      let min = hA * 60 + mA;
      min + AGENDA_CONFIG.duracaoMin <= hF * 60 + mF;
      min += AGENDA_CONFIG.duracaoMin
    ) {
      const inicio = dataSP(p.ano, p.mes, p.dia, Math.floor(min / 60), min % 60);
      const fim = new Date(inicio.getTime() + AGENDA_CONFIG.duracaoMin * 60000);
      const livre = inicio >= minimo && !conflita(inicio, fim, brokerId, ocupados);
      slots.push({
        inicioISO: inicio.toISOString(),
        rotulo: `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`,
        disponivel: livre,
      });
    }
    if (slots.length) {
      dias.push({
        chave: chaveDiaSP(base),
        rotulo: `${DIAS_CURTOS[p.diaSemana]}, ${String(p.dia).padStart(2, "0")}/${String(p.mes).padStart(2, "0")}`,
        slots,
      });
    }
  }
  return dias;
}

/** "qua, 15/10 às 14:00" — para telas e mensagens. */
export function formatarDataHoraSP(d: Date): string {
  const p = partesSP(d);
  return `${DIAS_CURTOS[p.diaSemana]}, ${String(p.dia).padStart(2, "0")}/${String(p.mes).padStart(2, "0")} às ${String(p.hora).padStart(2, "0")}:${String(p.minuto).padStart(2, "0")}`;
}
