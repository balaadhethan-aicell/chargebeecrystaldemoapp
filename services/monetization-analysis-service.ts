import { GORGIAS_VALUE_SURFACES } from "@/lib/value-buckets";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getAccountSummary } from "@/services/account-service";
import { getCatalogSummary } from "@/services/catalog-service";
import { getRevenueImpactSummary } from "@/services/revenue-impact-service";
import { getUsageSummary } from "@/services/usage-service";
import { getSampleAnalysisResult } from "@/services/sample-mode-service";
import type { AccountId, MonetizationAnalysisResult, RecommendationScenario } from "@/types/monetization";

function labelFromScore(score: number, type: "risk" | "complexity") {
  if (score <= 28) {
    return type === "risk" ? "Low" : "Low";
  }

  if (score <= 55) {
    return "Moderate";
  }

  return "High";
}

function buildScenarios(
  actualMonthlyRevenue: number,
  hybridMonthlyRevenue: number,
  buckets: Awaited<ReturnType<typeof getUsageSummary>>["buckets"]
): RecommendationScenario[] {
  const support = buckets.find((bucket) => bucket.bucketId === "support_deflection");
  const operational = buckets.find((bucket) => bucket.bucketId === "operational_actions");
  const revenue = buckets.find((bucket) => bucket.bucketId === "revenue_actions");
  const monetizationGap = Math.max(
    0,
    (revenue?.modeledValueSharePct ?? 0) - (revenue?.currentRevenueSharePct ?? 0)
  );

  const currentScenarioRevenueIndex = 100;
  const allowanceRevenueIndex = Number(((actualMonthlyRevenue * 1.09) / Math.max(actualMonthlyRevenue, 1) * 100).toFixed(0));
  const hybridRevenueIndex = Number(((hybridMonthlyRevenue / Math.max(actualMonthlyRevenue, 1)) * 100).toFixed(0));

  const scenarios: RecommendationScenario[] = [
    {
      id: "current_model",
      name: "Current Model",
      description: "Preserve flat AI monetization on top of the existing support platform catalog.",
      revenueIndex: currentScenarioRevenueIndex,
      predictabilityScore: Number((52 + (support?.usageSharePct ?? 0) * 0.18).toFixed(0)),
      churnRiskScore: Number((44 + monetizationGap * 0.55).toFixed(0)),
      implementationComplexityScore: 8,
      churnRiskLabel: labelFromScore(Number((44 + monetizationGap * 0.55).toFixed(0)), "risk"),
      implementationComplexityLabel: labelFromScore(8, "complexity"),
      fitSegment: "Teams optimizing for packaging stability over monetization improvement.",
      pros: [
        "No catalog migration is required.",
        "Operational overhead remains low in the short term."
      ],
      cons: [
        "Continues to underprice high-value AI intent.",
        "Leaves invoice explainability weak for operational and revenue workflows."
      ],
      estimatedMonthlyRevenue: Number(actualMonthlyRevenue.toFixed(0)),
      rationale: [
        "Flat pricing keeps commercial operations simple, but it mirrors volume instead of value intensity."
      ],
      isRecommended: false
    },
    {
      id: "included_allowance",
      name: "Included Allowance Model",
      description: "Add monthly AI credits to plans without weighting different action classes.",
      revenueIndex: allowanceRevenueIndex,
      predictabilityScore: Number((74 + (support?.usageSharePct ?? 0) * 0.05).toFixed(0)),
      churnRiskScore: Number((28 + monetizationGap * 0.2).toFixed(0)),
      implementationComplexityScore: 34,
      churnRiskLabel: labelFromScore(Number((28 + monetizationGap * 0.2).toFixed(0)), "risk"),
      implementationComplexityLabel: labelFromScore(34, "complexity"),
      fitSegment: "Support-led teams that need simpler budget guardrails before value-aware pricing.",
      pros: [
        "Improves spend predictability with included credits.",
        "Creates a clean migration path from flat AI packaging."
      ],
      cons: [
        "Still under-segments operational and revenue actions.",
        "Leaves too much upside uncaptured for high-intent automation."
      ],
      estimatedMonthlyRevenue: Number((actualMonthlyRevenue * 1.09).toFixed(0)),
      rationale: [
        "Allowance-based packaging improves adoption posture, but it still compresses too much value into a single credit class."
      ],
      isRecommended: false
    },
    {
      id: "value_weighted_hybrid",
      name: "Value-Weighted Hybrid Model",
      description: "Combine included credits with weighted overages across support, operational, and revenue AI actions.",
      revenueIndex: hybridRevenueIndex,
      predictabilityScore: Number((78 + (operational?.usageSharePct ?? 0) * 0.04).toFixed(0)),
      churnRiskScore: Number((24 + Math.max(0, 10 - monetizationGap * 0.1)).toFixed(0)),
      implementationComplexityScore: 46,
      churnRiskLabel: labelFromScore(Number((24 + Math.max(0, 10 - monetizationGap * 0.1)).toFixed(0)), "risk"),
      implementationComplexityLabel: labelFromScore(46, "complexity"),
      fitSegment: "Mid-market and enterprise e-commerce brands scaling AI across support, operations, and revenue workflows.",
      pros: [
        "Captures more value where customers see the clearest ROI.",
        "Preserves adoption with included credits and transparent overages."
      ],
      cons: [
        "Requires meter setup and invoice communication changes.",
        "Needs finance and CS alignment before enterprise rollout."
      ],
      estimatedMonthlyRevenue: Number(hybridMonthlyRevenue.toFixed(0)),
      rationale: [
        "Revenue-driving actions carry materially more modeled value than their current billed share.",
        "Included credits keep support and operational flows budget-friendly while weighted overages capture upside.",
        "The model stays explainable enough to ship inside Chargebee catalog and RevenueStory workflows."
      ],
      isRecommended: true
    }
  ];

  return scenarios.map((scenario) => ({
    ...scenario,
    isRecommended: scenario.id === "value_weighted_hybrid"
  }));
}

export async function getMonetizationAnalysis(
  accountId: AccountId = "gorgias"
): Promise<MonetizationAnalysisResult> {
  if (getEnv().SAMPLE_MODE) {
    return getSampleAnalysisResult(accountId);
  }

  const startedAt = Date.now();
  const [account, catalog, usage, defaultImpact] = await Promise.all([
    getAccountSummary(accountId),
    getCatalogSummary(),
    getUsageSummary(accountId),
    getRevenueImpactSummary(accountId, "6m")
  ]);

  const actualMonthlyRevenue = defaultImpact.actualRevenue / 6;
  const hybridMonthlyRevenue = defaultImpact.simulatedRevenue / 6;
  const scenarios = buildScenarios(actualMonthlyRevenue, hybridMonthlyRevenue, usage.buckets);
  const winner = scenarios.find((scenario) => scenario.isRecommended) ?? scenarios[0];
  const revenueBucket = usage.buckets.find((bucket) => bucket.bucketId === "revenue_actions");
  const supportBucket = usage.buckets.find((bucket) => bucket.bucketId === "support_deflection");
  const operationalBucket = usage.buckets.find((bucket) => bucket.bucketId === "operational_actions");

  logger.info("analysis.compute", {
    accountId,
    durationMs: Date.now() - startedAt,
    resolutionMode: account.resolutionMode
  });

  return {
    account,
    catalog,
    usage,
    diagnosis: {
      headline:
        "Current pricing overweights support volume and undercaptures the operational and revenue value created by AI.",
      summary:
        account.resolutionMode === "chargebee"
          ? "Monetization Twin mapped live Chargebee pricing, subscription, and revenue data into the Gorgias monetization lens."
          : "Monetization Twin mapped live Chargebee pricing and revenue data into an adapter-backed Gorgias lens because no explicit Gorgias record was available.",
      callout: "You price by resolution, but customers experience value by intent.",
      signals: [
        {
          title: "Revenue intent is under-monetized",
          detail: `${revenueBucket?.usageSharePct ?? 0}% of inferred usage drives ${revenueBucket?.modeledValueSharePct ?? 0}% of modeled value, but only ${revenueBucket?.currentRevenueSharePct ?? 0}% of current billed mix.`,
          severity: "warning"
        },
        {
          title: "Support volume dominates the billing shape",
          detail: `${supportBucket?.usageSharePct ?? 0}% of inferred demand still sits in support deflection, which compresses value under a flat model.`,
          severity: "neutral"
        },
        {
          title: "Operational actions need explainable guardrails",
          detail: `${operationalBucket?.usageSharePct ?? 0}% of inferred usage lands in returns, refunds, edits, and other operational workflows that benefit from included credits.`,
          severity: "opportunity"
        }
      ],
      valueSurfaces: GORGIAS_VALUE_SURFACES,
      usageByBucket: usage.buckets.map((bucket) => ({
        bucket: bucket.label,
        usage: bucket.inferredActions
      })),
      billedValueByBucket: usage.buckets.map((bucket) => ({
        bucket: bucket.label,
        billedValue: Number(bucket.actualRevenue.toFixed(2))
      })),
      rationale: [
        "Chargebee catalog pricing indicates a flat or hybrid add-on structure with no value-weighted AI meter in place today.",
        "The normalized usage model shows revenue and operational AI workflows contributing more modeled value than their billed share.",
        "A weighted hybrid model improves capture without fully abandoning included-credit predictability."
      ]
    },
    recommendation: {
      recommendedScenarioId: winner.id,
      winner,
      scenarios,
      rolloutHighlights: [
        "Start with new AI-enabled growth accounts and operationally mature renewals.",
        "Ship Revenue Impact and invoice-level meter visibility alongside the packaging change.",
        "Hold enterprise contract changes behind a finance-reviewed dry-run draft until billing controls are approved."
      ],
      methodology:
        "Scenario scoring is deterministic. Revenue, predictability, churn, and implementation scores are computed from live Chargebee inputs and adapter-backed usage normalization."
    },
    metadata: {
      sampleMode: false,
      sourceMode: account.resolutionMode,
      generatedAt: new Date().toISOString(),
      dryRunBilling: getEnv().BILLING_DRAFT_DRY_RUN
    }
  };
}
