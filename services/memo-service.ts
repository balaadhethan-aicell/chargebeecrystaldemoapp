import { z } from "zod";
import { generateStructuredOutput } from "@/lib/providers/openai";
import { getMonetizationAnalysis } from "@/services/monetization-analysis-service";
import { getRevenueImpactSummary } from "@/services/revenue-impact-service";
import { logger } from "@/lib/logger";
import type { AccountId, ExecMemo, NarrativeBundle } from "@/types/monetization";

const execMemoSchema = z.object({
  title: z.string().min(12),
  currentIssue: z.string().min(40),
  recommendation: z.string().min(40),
  expectedUpside: z.string().min(30),
  rolloutPlan: z.string().min(40),
  risks: z.array(z.string().min(10)).min(3).max(5),
  methodologyNote: z.string().min(20)
});

const narrativeSchema = z.object({
  diagnosisSummary: z.string().min(40),
  recommendationExplanation: z.string().min(40),
  rolloutNarrative: z.string().min(40),
  execMemo: execMemoSchema
});

const narrativeJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["diagnosisSummary", "recommendationExplanation", "rolloutNarrative", "execMemo"],
  properties: {
    diagnosisSummary: { type: "string" },
    recommendationExplanation: { type: "string" },
    rolloutNarrative: { type: "string" },
    execMemo: {
      type: "object",
      additionalProperties: false,
      required: ["title", "currentIssue", "recommendation", "expectedUpside", "rolloutPlan", "risks", "methodologyNote"],
      properties: {
        title: { type: "string" },
        currentIssue: { type: "string" },
        recommendation: { type: "string" },
        expectedUpside: { type: "string" },
        rolloutPlan: { type: "string" },
        risks: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
        methodologyNote: { type: "string" }
      }
    }
  }
} as const;

function fallbackNarrative(analysis: Awaited<ReturnType<typeof getMonetizationAnalysis>>, revenueImpact: Awaited<ReturnType<typeof getRevenueImpactSummary>>): NarrativeBundle {
  return {
    diagnosisSummary:
      "Gorgias is monetizing AI with a pricing shape that still behaves like flat outcome billing. Live Chargebee catalog and revenue inputs show that support-oriented demand dominates the billing signal while higher-value operational and revenue workflows remain under-segmented.",
    recommendationExplanation:
      "The Value-Weighted Hybrid Model is the strongest fit because it keeps support deflection easy to adopt through included credits, while finally assigning more pricing weight to operational and revenue-driving AI actions. That balance improves value capture without forcing a disruptive enterprise repricing motion.",
    rolloutNarrative:
      "The rollout should start with new AI-enabled growth accounts and renewal cohorts that already show operational AI usage. Once invoice simulation and Revenue Impact reporting are validated, enterprise plans can move under a finance-reviewed dry-run execution path.",
    execMemo: {
      title: "Monetization Twin recommendation for Gorgias",
      currentIssue:
        "Current AI monetization compresses materially different workflows into a flat billing shape, which leaves revenue-driving intent underpriced and limits invoice explainability.",
      recommendation:
        "Adopt a value-weighted hybrid model with included credits and weighted overages across support, operational, and revenue action classes.",
      expectedUpside: `The modeled hybrid replay lifts revenue by ${revenueImpact.liftPct.toFixed(1)}% over the selected ${revenueImpact.window} window while preserving a stronger predictability posture.`,
      rolloutPlan:
        "Launch on growth tiers first, validate invoice simulation, then expand into enterprise plans through Chargebee Billing Draft dry runs before any live catalog update.",
      risks: [
        "Invoice messaging needs to explain weighted credits clearly before rollout.",
        "Enterprise contract changes require finance controls and preview sign-off.",
        "Adapter-backed usage inference should be replaced by native usage records when available."
      ],
      methodologyNote:
        "Metrics and recommendation ranking are deterministic. The narrative layer only explains the computed result."
    }
  };
}

export async function getNarrativeBundle(accountId: AccountId = "gorgias"): Promise<NarrativeBundle> {
  const [analysis, revenueImpact] = await Promise.all([
    getMonetizationAnalysis(accountId),
    getRevenueImpactSummary(accountId, "6m")
  ]);
  const fallback = fallbackNarrative(analysis, revenueImpact);

  try {
    return await generateStructuredOutput({
      schemaName: "monetization_twin_narrative",
      schema: narrativeJsonSchema,
      validator: narrativeSchema,
      systemPrompt:
        "You write concise enterprise SaaS narrative copy for a Chargebee-native internal product. Preserve all metrics exactly as given. Do not invent, modify, or reinterpret numbers. Do not change the recommendation ranking. Do not change the recommended scenario. Only adjust explanation and framing.",
      userPrompt: `Account label: ${analysis.account.displayName}
Resolution mode: ${analysis.metadata.sourceMode}
Current monetization model: ${analysis.account.currentMonetizationModel}
Diagnosis headline: ${analysis.diagnosis.headline}
Recommended model: ${analysis.recommendation.winner.name}
Scenario ranking:
- ${analysis.recommendation.scenarios.map((scenario) => `${scenario.name}: revenue index ${scenario.revenueIndex}`).join("\n- ")}
Revenue impact:
- Actual revenue: ${revenueImpact.actualRevenue}
- Simulated revenue: ${revenueImpact.simulatedRevenue}
- Lift %: ${revenueImpact.liftPct}
Methodology note: ${analysis.recommendation.methodology}

Return polished explanation copy only.`
    });
  } catch (error) {
    logger.warn("memo.fallback", {
      message: error instanceof Error ? error.message : "Unknown error"
    });
    return fallback;
  }
}

export async function getExecMemo(accountId: AccountId = "gorgias"): Promise<ExecMemo> {
  const bundle = await getNarrativeBundle(accountId);
  return bundle.execMemo;
}
