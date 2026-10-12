// Gera arquivos .ics (lembrete de calendário) para visitas e atendimentos.
// Datas sempre em UTC no formato YYYYMMDDTHHMMSSZ — o aplicativo de
// calendário converte para o fuso de quem abre o arquivo.
//
// Duas variantes:
// - icsParaEquipe: leva nome e telefone do cliente (uso interno).
// - icsParaCliente: leva SÓ bairro/cidade (nunca rua/número) e avisa que a
//   equipe confirma o endereço exato.
import type { Appointment, Property } from "@prisma/client";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";

export type ImovelParaIcs = Pick<
  Property,
  "refCode" | "title" | "propertyType" | "neighborhood" | "city" | "addressVisibility"
>;

function p2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Date -> "20261015T170000Z" (UTC). */
function dataUTC(d: Date): string {
  return (
    `${d.getUTCFullYear()}${p2(d.getUTCMonth() + 1)}${p2(d.getUTCDate())}` +
    `T${p2(d.getUTCHours())}${p2(d.getUTCMinutes())}${p2(d.getUTCSeconds())}Z`
  );
}

/** Escapa \ ; , e quebras de linha conforme o formato iCalendar (RFC 5545). */
function esc(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** "Bairro, Cidade" (ou só a cidade quando o bairro é oculto ao público). */
export function localPublico(p: ImovelParaIcs | null | undefined): string | null {
  if (!p) return null;
  const esconde = p.addressVisibility === "OCULTO";
  return !esconde && p.neighborhood ? `${p.neighborhood}, ${p.city}` : p.city;
}

/** "Casa em Centro, Bragança Paulista" | "Atendimento na imobiliária". */
export function tituloPublico(p: ImovelParaIcs | null | undefined): string {
  if (!p) return "Atendimento na imobiliária";
  const tipo = p.propertyType
    ? (PROPERTY_TYPE_LABELS[p.propertyType] ?? "Imóvel")
    : "Imóvel";
  return `${tipo} em ${localPublico(p)}`;
}

function resumoEvento(p: ImovelParaIcs | null | undefined): string {
  if (!p) return "Atendimento FC Imóveis";
  return `Visita FC Imóveis — ${tituloPublico(p)}`;
}

function montar(
  ap: Appointment,
  summary: string,
  description: string,
  location: string | null,
): string {
  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FC Imoveis//Agenda de Visitas//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ap.id}@fcimoveis`,
    `DTSTAMP:${dataUTC(new Date())}`,
    `DTSTART:${dataUTC(ap.startsAt)}`,
    `DTEND:${dataUTC(ap.endsAt)}`,
    `SUMMARY:${esc(summary)}`,
    `DESCRIPTION:${esc(description)}`,
  ];
  if (location) linhas.push(`LOCATION:${esc(location)}`);
  linhas.push("STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR");
  return linhas.join("\r\n") + "\r\n";
}

/** Variante da EQUIPE: inclui nome e contato do cliente. */
export function icsParaEquipe(
  ap: Appointment,
  property?: ImovelParaIcs | null,
): string {
  const partes = [
    `Cliente: ${ap.name} — WhatsApp: ${ap.phone}`,
    ap.email ? `E-mail: ${ap.email}` : null,
    property
      ? `Imóvel: ${property.refCode} — ${tituloPublico(property)}`
      : "Atendimento na imobiliária",
    ap.notes ? `Observações: ${ap.notes}` : null,
  ].filter((x): x is string => Boolean(x));
  return montar(ap, resumoEvento(property), partes.join("\n"), localPublico(property));
}

/** Variante do CLIENTE: só bairro/cidade — nunca rua, número ou CEP. */
export function icsParaCliente(
  ap: Appointment,
  property?: ImovelParaIcs | null,
): string {
  const partes = [
    property
      ? `Visita com a equipe da FC Imóveis — ${tituloPublico(property)}.`
      : "Atendimento com a equipe da FC Imóveis.",
    "Nossa equipe confirma o endereço exato antes da visita.",
  ];
  return montar(ap, resumoEvento(property), partes.join("\n"), localPublico(property));
}
