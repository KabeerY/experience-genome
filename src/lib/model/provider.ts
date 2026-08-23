import "server-only";

import { z } from "zod";

const modelConfigSchema = z.object({
  provider: z.string().default("openrouter"),
  baseUrl: z.string().url(),
  apiKey: z.string().min(1),
  modelId: z.string().min(1),
});

export type ModelConfig = z.infer<typeof modelConfigSchema>;

type StructuredRequest<TSchema extends z.ZodType> = {
  schema: TSchema;
  schemaName: string;
  system: string;
  prompt: string;
};

function readConfig(): ModelConfig {
  return modelConfigSchema.parse({
    provider: process.env.MODEL_PROVIDER ?? "openrouter",
    baseUrl: process.env.MODEL_BASE_URL ?? "https://openrouter.ai/api/v1",
    apiKey: process.env.MODEL_API_KEY,
    modelId: process.env.MODEL_ID ?? "stealth/ox-alpha",
  });
}

function parseAssistantContent(payload: unknown) {
  const responseSchema = z.object({
    choices: z.array(
      z.object({
        message: z.object({ content: z.string() }),
      }),
    ).min(1),
  });

  return responseSchema.parse(payload).choices[0].message.content;
}

async function requestCompletion(
  config: ModelConfig,
  request: StructuredRequest<z.ZodType>,
  repairContext?: string,
) {
  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      ...(config.provider === "openrouter"
        ? {
            "HTTP-Referer": "https://experience-genome.vercel.app",
            "X-Title": "Experience Compiler",
          }
        : {}),
    },
    body: JSON.stringify({
      model: config.modelId,
      temperature: 0.2,
      messages: [
        { role: "system", content: request.system },
        {
          role: "user",
          content: repairContext
            ? `${request.prompt}\n\nThe previous response failed validation. Return a corrected JSON object only. Validation context:\n${repairContext}`
            : request.prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: request.schemaName,
          strict: true,
          schema: z.toJSONSchema(request.schema),
        },
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Model provider returned ${response.status}.`);
  }

  return parseAssistantContent(await response.json());
}

export async function generateStructured<TSchema extends z.ZodType>(
  request: StructuredRequest<TSchema>,
): Promise<z.infer<TSchema>> {
  const config = readConfig();
  const firstContent = await requestCompletion(config, request);

  try {
    return request.schema.parse(JSON.parse(firstContent));
  } catch (firstError) {
    const context = firstError instanceof Error ? firstError.message : "Invalid JSON response.";
    const repairedContent = await requestCompletion(config, request, context);
    return request.schema.parse(JSON.parse(repairedContent));
  }
}

export function getModelIdentity() {
  const config = readConfig();
  return { provider: config.provider, id: config.modelId };
}
