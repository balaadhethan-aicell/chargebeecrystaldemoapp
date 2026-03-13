import { z } from "zod";
import { getEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const candidate = payload as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        text?: string;
      }>;
    }>;
  };

  if (typeof candidate.output_text === "string" && candidate.output_text.trim()) {
    return candidate.output_text;
  }

  return (
    candidate.output
      ?.flatMap((entry) => entry.content ?? [])
      .map((entry) => entry.text ?? "")
      .join("\n") ?? ""
  ).trim();
}

export async function generateStructuredOutput<T>({
  schemaName,
  schema,
  validator,
  systemPrompt,
  userPrompt
}: {
  schemaName: string;
  schema: Record<string, unknown>;
  validator: z.ZodType<T>;
  systemPrompt: string;
  userPrompt: string;
}) {
  const env = getEnv();

  if (!env.OPENAI_API_KEY) {
    throw new AppError("OPENAI_API_KEY is not configured.", {
      code: "openai_missing_key",
      status: 503
    });
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const startedAt = Date.now();
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemPrompt }]
          },
          {
            role: "user",
            content: [{ type: "input_text", text: userPrompt }]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: schemaName,
            strict: true,
            schema
          }
        }
      })
    });

    logger.info("openai.responses", {
      schemaName,
      status: response.status,
      durationMs: Date.now() - startedAt
    });

    if (!response.ok) {
      throw new AppError(`OpenAI request failed with status ${response.status}.`, {
        code: "openai_request_failed",
        status: 502
      });
    }

    const payload = await response.json();
    const outputText = extractOutputText(payload);

    try {
      return validator.parse(JSON.parse(outputText));
    } catch (error) {
      if (attempt === 1) {
        logger.error("openai.invalid_json", {
          schemaName,
          message: error instanceof Error ? error.message : "Unknown validation error"
        });
        throw new AppError("OpenAI returned an invalid structured payload.", {
          code: "openai_invalid_payload",
          status: 502
        });
      }
    }
  }

  throw new AppError("OpenAI did not return a valid structured response.", {
    code: "openai_invalid_payload",
    status: 502
  });
}
