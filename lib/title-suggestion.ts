import { PROPERTY_TYPE_LABELS } from "./constants";

/** Sugere um título de anúncio com o que já se sabe do imóvel. */
export function suggestTitle(p: {
  propertyType?: string | null;
  purpose?: string | null;
  neighborhood?: string | null;
  condoName?: string | null;
  bedrooms?: number | null;
  city?: string | null;
}): string {
  const type = p.propertyType
    ? PROPERTY_TYPE_LABELS[p.propertyType]
    : "Imóvel";
  const action =
    p.purpose === "LOCACAO"
      ? "para alugar"
      : p.purpose === "TEMPORADA"
        ? "para temporada"
        : p.purpose === "VENDA_LOCACAO"
          ? "à venda e para alugar"
          : "à venda";
  const rooms =
    p.bedrooms && p.bedrooms > 0
      ? ` com ${p.bedrooms} quarto${p.bedrooms > 1 ? "s" : ""}`
      : "";
  const place = p.condoName
    ? ` no ${p.condoName}`
    : p.neighborhood
      ? ` no bairro ${p.neighborhood}`
      : ` em ${p.city || "Bragança Paulista"}`;
  return `${type}${rooms} ${action}${place}`;
}
