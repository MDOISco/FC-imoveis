// Geração por IA (opcional): usada quando a chave da API está configurada.
// Qualquer falha retorna null e o chamador cai para os templates.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { DescriptionFacts } from "./facts";
import type { GeneratedDescriptions } from "./templates";

const ResultSchema = z.object({
  objetiva: z.string(),
  emocional: z.string(),
  investidor: z.string(),
});

const SYSTEM_PROMPT = `Você escreve descrições de anúncios imobiliários em português do Brasil para a FC Imóveis, de Bragança Paulista/SP.

O usuário envia um JSON com os FATOS cadastrados de um imóvel. Escreva 3 descrições diferentes do MESMO imóvel:
- "objetiva": factual e completa, direta, organizada (2 a 3 parágrafos).
- "emocional": acolhedora, focada no estilo de vida e nas sensações (2 a 3 parágrafos).
- "investidor": focada em oportunidade, números e liquidez (2 a 3 parágrafos).

Regras obrigatórias:
1. Use SOMENTE os fatos do JSON. Não invente nada: nem metragem, nem comodidade, nem condição de pagamento, nem característica do bairro que não esteja lá.
2. Nunca cite rua, número ou CEP. Localização é só bairro e cidade, e apenas se vierem no JSON (neighborhood pode ser null — aí cite só a cidade).
3. Campos null/false não existem: não os mencione (nem "não tem piscina").
4. Termine cada descrição convidando a falar com a FC Imóveis e citando o código de referência (refCode).
5. Tom respeitoso e natural, sem exageros ("IMPERDÍVEL!!!") e sem emojis.
6. "proximidades" (lugares perto do imóvel) e "distanciaCentro" podem ser citados, com os nomes e as faixas EXATAMENTE como vieram ("até 500 m", "até 10 km do Centro"). Nunca transforme a faixa em distância exata ("a 350 metros"), em tempo ("5 minutos a pé", "10 minutos de carro") nem cite endereço ou rua do estabelecimento. Lista vazia ou null: não fale de proximidades nem de distância.`;

export async function generateWithAI(
  facts: DescriptionFacts,
  apiKey: string,
): Promise<GeneratedDescriptions | null> {
  try {
    const client = new Anthropic({ apiKey, timeout: 30_000, maxRetries: 1 });
    const response = await client.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Fatos do imóvel:\n${JSON.stringify(facts, null, 2)}`,
        },
      ],
      output_config: { format: zodOutputFormat(ResultSchema) },
    });
    if (response.stop_reason === "refusal") return null;
    return response.parsed_output ?? null;
  } catch (err) {
    console.error("Geração por IA falhou; usando templates.", err);
    return null;
  }
}
