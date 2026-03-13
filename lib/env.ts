import { z } from "zod";

function booleanFlag(defaultValue: boolean, truthyWhenFalse = false) {
  return z.string().optional().transform((value) => {
    if (value === undefined) {
      return defaultValue;
    }

    return truthyWhenFalse ? value.toLowerCase() !== "false" : value.toLowerCase() === "true";
  });
}

const envSchema = z.object({
  CHARGEBEE_SITE: z.string().min(1, "CHARGEBEE_SITE is required"),
  CHARGEBEE_API_KEY: z.string().min(1, "CHARGEBEE_API_KEY is required"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-5.4"),
  SAMPLE_MODE: booleanFlag(false),
  BILLING_DRAFT_DRY_RUN: booleanFlag(true, true),
  BILLING_DRAFT_APPLY_MODE: booleanFlag(false)
});

export type AppEnv = z.infer<typeof envSchema>;

let parsedEnv: AppEnv | null = null;

export function getEnv() {
  if (parsedEnv) {
    return parsedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const message = result.error.errors.map((error) => error.message).join(", ");
    throw new Error(`Environment validation failed: ${message}`);
  }

  parsedEnv = result.data;
  return parsedEnv;
}

export function isSampleMode() {
  return getEnv().SAMPLE_MODE;
}
