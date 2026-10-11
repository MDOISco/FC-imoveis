import { onlyDigits } from "@/lib/format";

/** Link de WhatsApp a partir do número salvo em Configurações.
 *  Aceita "(11) 99999-0000" e afins; adiciona o +55 quando faltar. */
export function waHref(whatsapp: string | null, text: string): string | null {
  if (!whatsapp) return null;
  let d = onlyDigits(whatsapp);
  if (d.length < 10) return null;
  if (d.length <= 11) d = `55${d}`;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}
