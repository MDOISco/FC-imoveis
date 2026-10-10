// Orquestra a geração das 3 descrições: IA quando configurada, com fallback
// automático e silencioso para os templates.
import type { Property } from "@prisma/client";
import { getSettings } from "@/lib/settings";
import { generateWithAI } from "./ai";
import { buildFacts } from "./facts";
import {
  generateFromTemplates,
  type GeneratedDescriptions,
} from "./templates";

export type DescriptionsResult = GeneratedDescriptions & {
  origem: "ia" | "template";
};

export async function generateDescriptions(
  property: Property,
  regen: number,
): Promise<DescriptionsResult> {
  const facts = buildFacts(property);
  const settings = await getSettings();

  if (settings.anthropicApiKey) {
    const ai = await generateWithAI(facts, settings.anthropicApiKey);
    if (ai) return { ...ai, origem: "ia" };
  }

  return {
    ...generateFromTemplates(facts, property.id, regen),
    origem: "template",
  };
}
