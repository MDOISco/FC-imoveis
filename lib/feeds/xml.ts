// Utilitários de XML para os feeds dos portais.

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** CDATA seguro: divide ocorrências de "]]>" dentro do texto. */
export function cdata(value: string): string {
  return `<![CDATA[${value.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}

export function tag(
  name: string,
  content: string | number | null | undefined,
  attrs?: Record<string, string | number | undefined>,
): string {
  if (content === null || content === undefined || content === "") return "";
  const attrText = attrs
    ? Object.entries(attrs)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => ` ${k}="${escapeXml(String(v))}"`)
        .join("")
    : "";
  return `<${name}${attrText}>${content}</${name}>`;
}
