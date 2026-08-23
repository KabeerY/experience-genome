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
  images?: string[];
  validate?: (value: z.infer<TSchema>) => string[];
  modelId?: string;
  maxTokens?: number;
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high";
  timeoutMs?: number;
};

function readConfig(): ModelConfig {
  const provider = process.env.MODEL_PROVIDER ?? "openrouter";
  const isFireworks = provider === "fireworks";
  return modelConfigSchema.parse({
    provider,
    baseUrl:
      process.env.MODEL_BASE_URL ??
      (isFireworks ? "https://api.fireworks.ai/inference/v1" : "https://openrouter.ai/api/v1"),
    apiKey:
      process.env.MODEL_API_KEY ??
      (isFireworks ? process.env.FIREWORKS_API_KEY : process.env.OPENROUTER_API_KEY),
    modelId:
      process.env.MODEL_ID ??
      (isFireworks ? "accounts/fireworks/models/kimi-k2p6" : "stealth/ox-alpha"),
  });
}

function parseAssistantContent(payload: unknown) {
  const responseSchema = z.object({
    choices: z.array(
      z.object({
        finish_reason: z.string().nullish(),
        message: z.object({
          content: z.string().nullable(),
          reasoning: z.string().nullish(),
          reasoning_content: z.string().nullish(),
        }),
      }),
    ).min(1),
  });

  const choice = responseSchema.parse(payload).choices[0];
  if (!choice.message.content) {
    const reasoning = choice.message.reasoning ?? choice.message.reasoning_content;
    throw new Error(
      `Model returned no final content (finish: ${choice.finish_reason ?? "unknown"}, reasoning characters: ${reasoning?.length ?? 0}).`,
    );
  }
  return choice.message.content;
}

async function requestCompletion(
  config: ModelConfig,
  request: StructuredRequest<z.ZodType>,
  repairContext?: string,
) {
  const schema = z.toJSONSchema(request.schema);
  const responseFormat = {
    type: "json_schema",
    json_schema: {
      name: request.schemaName,
      ...(config.provider === "openrouter" ? { strict: true } : {}),
      schema,
    },
  };
  const reasoning =
    config.provider === "openrouter"
      ? { reasoning: { effort: request.reasoningEffort ?? "low", exclude: true } }
      : config.provider === "fireworks"
        ? { reasoning_effort: "none" }
        : {};
  const basePrompt = repairContext
    ? `${request.prompt}\n\nThe previous response failed validation. Return a corrected JSON object only. Validation context:\n${repairContext}`
    : request.prompt;
  const userPrompt = `${basePrompt}\n\nOUTPUT CONTRACT — return JSON only, matching this schema exactly:\n${JSON.stringify(schema)}`;

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
      model: request.modelId ?? config.modelId,
      temperature: 0.2,
      messages: [
        { role: "system", content: request.system },
        {
          role: "user",
          content: request.images?.length
            ? [
                {
                  type: "text",
                  text: userPrompt,
                },
                ...request.images.map((url) => ({ type: "image_url", image_url: { url } })),
              ]
            : userPrompt,
        },
      ],
      max_tokens: request.maxTokens ?? 8_000,
      ...reasoning,
      ...(config.provider === "openrouter" ? { provider: { require_parameters: true } } : {}),
      response_format: responseFormat,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(request.timeoutMs ?? 55_000),
  });

  if (!response.ok) {
    const errorPayload: unknown = await response.json().catch(() => null);
    const providerMessage =
      errorPayload &&
      typeof errorPayload === "object" &&
      "error" in errorPayload &&
      errorPayload.error &&
      typeof errorPayload.error === "object" &&
      "message" in errorPayload.error &&
      typeof errorPayload.error.message === "string"
        ? errorPayload.error.message.slice(0, 400)
        : "No provider detail returned.";
    throw new Error(`Model provider returned ${response.status}: ${providerMessage}`);
  }

  return parseAssistantContent(await response.json());
}

export async function generateStructured<TSchema extends z.ZodType>(
  request: StructuredRequest<TSchema>,
): Promise<z.infer<TSchema>> {
  const config = readConfig();
  const firstContent = await requestCompletion(config, request);

  const parseAndValidate = (content: string) => {
    const normalized = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const value = request.schema.parse(JSON.parse(normalized));
    const issues = request.validate?.(value) ?? [];
    if (issues.length) throw new Error(issues.join("\n"));
    return value;
  };

  try {
    return parseAndValidate(firstContent);
  } catch (firstError) {
    const context = firstError instanceof Error ? firstError.message : "Invalid JSON response.";
    const repairedContent = await requestCompletion(config, request, context);
    return parseAndValidate(repairedContent);
  }
}

export function getModelIdentity(modelId?: string) {
  const config = readConfig();
  return { provider: config.provider, id: modelId ?? config.modelId };
}
