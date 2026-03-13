import { getFixtureBundle } from "@/lib/fixtures";
import { GORGIAS_VALUE_SURFACES } from "@/lib/value-buckets";
import type {
  AccountId,
  AccountSummary,
  BillingDraft,
  BillingDraftExecutionResult,
  BillingDraftPreview,
  CatalogSummary,
  MonetizationAnalysisResult,
  RevenueImpactSummary,
  RevenueWindow,
  UsageSummary
} from "@/types/monetization";

function currencyCode() {
  return "USD";
}

export function getSampleCatalogSummary(): CatalogSummary {
  return {
    currencyCode: currencyCode(),
    plans: [
      {
        itemPriceId: "support-pro-ai-assist",
        itemId: "support-pro",
        name: "Support Pro + AI Assist",
        externalName: "Support Pro + AI Assist",
        amount: 1500,
        currencyCode: currencyCode(),
        periodUnit: "month",
        itemType: "plan",
        normalizedSegment: "starter"
      },
      {
        itemPriceId: "support-scale-ai-control",
        itemId: "support-scale",
        name: "Support Scale + AI Control",
        externalName: "Support Scale + AI Control",
        amount: 4500,
        currencyCode: currencyCode(),
        periodUnit: "month",
        itemType: "plan",
        normalizedSegment: "growth"
      },
      {
        itemPriceId: "support-enterprise-ai-twin",
        itemId: "support-enterprise",
        name: "Support Enterprise + AI Twin",
        externalName: "Support Enterprise + AI Twin",
        amount: 9500,
        currencyCode: currencyCode(),
        periodUnit: "month",
        itemType: "plan",
        normalizedSegment: "enterprise"
      }
    ],
    addOns: [],
    currentPricingModel: "flat",
    notes: ["Sample mode uses the original Gorgias fixture catalog."]
  };
}

export function getSampleAccountSummary(accountId: AccountId = "gorgias"): AccountSummary {
  const { account } = getFixtureBundle(accountId);

  return {
    id: accountId,
    displayName: account.name,
    currencyCode: currencyCode(),
    foundation: account.foundation,
    currentMonetizationModel: account.currentModel,
    aiRevenueContributionPct: account.aiRevenueContributionPct,
    aiAttachRatePct: account.aiAttachRatePct,
    expansionTrendPct: account.expansionTrendPct,
    arr: account.arr,
    summary: account.summary,
    primaryGoal: account.primaryGoal,
    resolutionMode: "sample",
    planMix: account.planMix.map((plan, index) => ({
      planId: `sample-${index}`,
      planName: plan.plan,
      normalizedSegment: index === 0 ? "starter" : index === account.planMix.length - 1 ? "enterprise" : "growth",
      activeSubscriptions: plan.accounts,
      aiAttachRatePct: plan.aiAttachRatePct,
      monthlyRecurringRevenue: Math.round((account.arr / 12 / account.planMix.length) * (plan.sharePct / 100)),
      includedCredits: index === 0 ? 8_000 : index === account.planMix.length - 1 ? 120_000 : 35_000
    })),
    stats: [
      {
        label: "Commercial foundation",
        value: account.foundation,
        detail: "Fixture-backed sample mode."
      },
      {
        label: "AI revenue contribution",
        value: `${account.aiRevenueContributionPct.toFixed(1)}%`,
        detail: "Sample mode metric."
      },
      {
        label: "AI attach rate",
        value: `${account.aiAttachRatePct.toFixed(1)}%`,
        detail: "Sample mode metric."
      },
      {
        label: "Data resolution",
        value: "Sample",
        detail: "Loaded from local fixtures only."
      }
    ],
    notes: ["Sample mode is isolated from the main live Chargebee runtime path."]
  };
}

export function getSampleUsageSummary(accountId: AccountId = "gorgias"): UsageSummary {
  const { usage } = getFixtureBundle(accountId);
  const buckets = [
    {
      bucketId: "support_deflection" as const,
      label: "Support Deflection",
      inferredActions: usage.actions.filter((action) => ["faq", "order_tracking"].includes(action.actionType)).reduce((sum, action) => sum + action.monthlyVolume, 0),
      weightedCredits: usage.actions.filter((action) => ["faq", "order_tracking"].includes(action.actionType)).reduce((sum, action) => sum + action.monthlyVolume, 0),
      actualRevenue: 21240,
      simulatedRevenue: 21420,
      currentRevenueSharePct: 52,
      modeledValueSharePct: 21,
      usageSharePct: 56,
      method: "invoice_inference" as const
    },
    {
      bucketId: "operational_actions" as const,
      label: "Operational Actions",
      inferredActions: usage.actions.filter((action) => ["returns", "refunds", "order_edits", "subscription_edits"].includes(action.actionType)).reduce((sum, action) => sum + action.monthlyVolume, 0),
      weightedCredits: usage.actions.filter((action) => ["returns", "refunds", "order_edits", "subscription_edits"].includes(action.actionType)).reduce((sum, action) => sum + action.monthlyVolume * 3, 0),
      actualRevenue: 10020,
      simulatedRevenue: 12600,
      currentRevenueSharePct: 24,
      modeledValueSharePct: 32,
      usageSharePct: 27,
      method: "invoice_inference" as const
    },
    {
      bucketId: "revenue_actions" as const,
      label: "Revenue Actions",
      inferredActions: usage.actions.filter((action) => ["discounts", "product_recommendations", "recommendation_purchase"].includes(action.actionType)).reduce((sum, action) => sum + action.monthlyVolume, 0),
      weightedCredits: usage.actions.filter((action) => ["discounts", "product_recommendations", "recommendation_purchase"].includes(action.actionType)).reduce((sum, action) => sum + action.monthlyVolume * 6, 0),
      actualRevenue: 8820,
      simulatedRevenue: 14940,
      currentRevenueSharePct: 24,
      modeledValueSharePct: 47,
      usageSharePct: 17,
      method: "invoice_inference" as const
    }
  ];

  return {
    currencyCode: currencyCode(),
    method: "invoice_inference",
    hasUsageRecords: false,
    buckets,
    monthlySeries: usage.monthlyTrend.map((month) => ({
      month: month.month,
      actualRevenue: month.aiRevenue,
      baseRecurringRevenue: month.aiRevenue,
      supportDeflection: Math.round(month.aiRevenue * 0.56),
      operationalActions: Math.round(month.aiRevenue * 0.27),
      revenueActions: Math.round(month.aiRevenue * 0.17)
    })),
    notes: ["Sample mode uses deterministic fixture-backed usage replay."]
  };
}

export function getSampleRevenueImpactSummary(
  accountId: AccountId = "gorgias",
  window: RevenueWindow = "6m"
): RevenueImpactSummary {
  const usage = getSampleUsageSummary(accountId);
  const monthCount = window === "3m" ? 3 : window === "6m" ? 6 : 12;
  const series = usage.monthlySeries.slice(-monthCount).map((point) => ({
    month: point.month,
    actualRevenue: point.actualRevenue,
    simulatedRevenue: Math.round(point.actualRevenue * 1.19),
    incrementalLift: Math.round(point.actualRevenue * 0.19),
    liftPct: 19
  }));
  const actualRevenue = series.reduce((sum, point) => sum + point.actualRevenue, 0);
  const simulatedRevenue = series.reduce((sum, point) => sum + point.simulatedRevenue, 0);

  return {
    window,
    currencyCode: currencyCode(),
    methodology: "Sample mode uses fixture-backed invoice replay.",
    actualRevenue,
    simulatedRevenue,
    incrementalRevenueLift: simulatedRevenue - actualRevenue,
    liftPct: Number((((simulatedRevenue - actualRevenue) / actualRevenue) * 100).toFixed(1)),
    series,
    valueBucketContribution: usage.buckets.map((bucket) => ({
      bucket: bucket.label,
      actual: bucket.actualRevenue,
      simulated: bucket.simulatedRevenue
    })),
    cards: [
      {
        label: "Actual revenue",
        value: `${currencyCode()} ${actualRevenue}`,
        detail: "Fixture-backed actual revenue."
      },
      {
        label: "Simulated hybrid revenue",
        value: `${currencyCode()} ${simulatedRevenue}`,
        detail: "Fixture-backed hybrid replay."
      },
      {
        label: "Incremental lift",
        value: `${currencyCode()} ${simulatedRevenue - actualRevenue}`,
        detail: "Sample mode lift."
      },
      {
        label: "Lift %",
        value: `${Number((((simulatedRevenue - actualRevenue) / actualRevenue) * 100).toFixed(1))}%`,
        detail: "Sample mode lift rate."
      }
    ],
    notes: ["Sample mode is intended for local development only."]
  };
}

export function getSampleBillingDraft(accountId: AccountId = "gorgias"): BillingDraft {
  void accountId;

  return {
    itemFamilyId: "ai_monetization",
    itemFamilyName: "AI Monetization",
    currencyCode: currencyCode(),
    plans: [
      {
        id: "starter",
        planName: "Support Pro + AI Assist",
        normalizedSegment: "starter",
        currentPrice: 1500,
        proposedPrice: 1690,
        includedCredits: 8000,
        targetSegment: "Starter teams",
        updateSummary: "Add included credits and weighted overage."
      },
      {
        id: "growth",
        planName: "Support Scale + AI Control",
        normalizedSegment: "growth",
        currentPrice: 4500,
        proposedPrice: 5310,
        includedCredits: 35000,
        targetSegment: "Growth teams",
        updateSummary: "Add included credits and weighted overage."
      },
      {
        id: "enterprise",
        planName: "Support Enterprise + AI Twin",
        normalizedSegment: "enterprise",
        currentPrice: 9500,
        proposedPrice: 11780,
        includedCredits: 120000,
        targetSegment: "Enterprise teams",
        updateSummary: "Add commit guardrails and weighted overage."
      }
    ],
    proposedAddOns: [
      {
        id: "revenue-pack",
        name: "Revenue Actions Pack",
        pricing: "USD 0.67 per weighted credit over allowance",
        purpose: "Captures high-value revenue actions."
      }
    ],
    meters: [
      {
        id: "weighted_ai_credits",
        name: "Weighted AI Credits",
        unit: "weighted credits",
        ratingLogic: "Allowance resets monthly."
      }
    ],
    weightedCreditClasses: [
      {
        bucket: "Support Deflection",
        weight: "1x",
        examples: "FAQ, order tracking"
      },
      {
        bucket: "Operational Actions",
        weight: "3x",
        examples: "Returns, refunds, order edits, subscription edits"
      },
      {
        bucket: "Revenue Actions",
        weight: "6x",
        examples: "Discounts, product recommendations, recommendation-to-purchase events"
      }
    ],
    overageRules: [
      {
        rule: "Threshold notifications",
        detail: "Alert at 80% and 95% of credits."
      }
    ],
    notes: ["Sample mode billing draft."]
  };
}

export function getSampleBillingPreview(
  accountId: AccountId,
  includedSegments: Array<"starter" | "growth" | "enterprise">
): BillingDraftPreview {
  const draft = getSampleBillingDraft(accountId);

  return {
    includedSegments,
    excludedSegments: (["starter", "growth", "enterprise"] as const).filter((segment) => !includedSegments.includes(segment)),
    planCount: draft.plans.filter((plan) => includedSegments.includes(plan.normalizedSegment)).length,
    mode: "dry_run",
    summary: "Sample mode preview only.",
    payloadPreview: {
      itemFamilyId: draft.itemFamilyId,
      planUpdates: draft.plans
        .filter((plan) => includedSegments.includes(plan.normalizedSegment))
        .map((plan) => ({
          segment: plan.normalizedSegment,
          proposedPrice: plan.proposedPrice,
          includedCredits: plan.includedCredits
        })),
      meterIds: draft.meters.map((meter) => meter.id)
    },
    notes: ["Sample mode preview only."]
  };
}

export function getSampleBillingExecutionResult(
  accountId: AccountId,
  includedSegments: Array<"starter" | "growth" | "enterprise">
): BillingDraftExecutionResult {
  const preview = getSampleBillingPreview(accountId, includedSegments);

  return {
    mode: "dry_run",
    dryRun: true,
    success: true,
    message: "Sample mode execution completed in dry run.",
    operations: preview.payloadPreview.planUpdates.map((plan) => ({
      type: "plan_update",
      status: "simulated",
      target: `${plan.segment}:sample`
    }))
  };
}

export function getSampleAnalysisResult(accountId: AccountId = "gorgias"): MonetizationAnalysisResult {
  const account = getSampleAccountSummary(accountId);
  const usage = getSampleUsageSummary(accountId);
  const revenue = getSampleRevenueImpactSummary(accountId, "6m");

  return {
    account,
    catalog: getSampleCatalogSummary(),
    usage,
    diagnosis: {
      headline:
        "Flat outcome pricing is over-indexing on support deflection volume and underpricing operational and revenue intent.",
      summary: account.summary,
      callout: "You price by resolution, but customers experience value by intent.",
      signals: [
        {
          title: "Revenue intent is materially underpriced",
          detail: "Revenue-driving AI outcomes represent a minority of volume but a much larger share of modeled value.",
          severity: "warning"
        },
        {
          title: "Support volume dominates pricing shape",
          detail: "Support deflection still sets the billing baseline under flat outcome pricing.",
          severity: "neutral"
        },
        {
          title: "Operational actions need predictable packaging",
          detail: "Included credits improve adoption for operational workflows without forcing enterprise repricing.",
          severity: "opportunity"
        }
      ],
      valueSurfaces: GORGIAS_VALUE_SURFACES,
      usageByBucket: usage.buckets.map((bucket) => ({ bucket: bucket.label, usage: bucket.inferredActions })),
      billedValueByBucket: usage.buckets.map((bucket) => ({ bucket: bucket.label, billedValue: bucket.actualRevenue })),
      rationale: [
        "Sample mode keeps the original Gorgias thesis intact for local development."
      ]
    },
    recommendation: {
      recommendedScenarioId: "value_weighted_hybrid",
      winner: {
        id: "value_weighted_hybrid",
        name: "Value-Weighted Hybrid Model",
        description: "Included credits plus weighted overages by action class.",
        revenueIndex: 119,
        predictabilityScore: 81,
        churnRiskScore: 24,
        implementationComplexityScore: 46,
        churnRiskLabel: "Low",
        implementationComplexityLabel: "Moderate",
        fitSegment: "Mid-market and enterprise e-commerce brands",
        pros: ["Captures more value.", "Preserves predictability."],
        cons: ["Requires meter setup."],
        estimatedMonthlyRevenue: Math.round(revenue.simulatedRevenue / 6),
        rationale: ["Balances value capture and predictability."],
        isRecommended: true
      },
      scenarios: [
        {
          id: "current_model",
          name: "Current Model",
          description: "Preserve flat AI outcome pricing.",
          revenueIndex: 100,
          predictabilityScore: 54,
          churnRiskScore: 43,
          implementationComplexityScore: 8,
          churnRiskLabel: "Moderate",
          implementationComplexityLabel: "Low",
          fitSegment: "Accounts optimizing for near-term packaging stability.",
          pros: ["No migration work."],
          cons: ["Leaves value undercaptured."],
          estimatedMonthlyRevenue: Math.round(revenue.actualRevenue / 6),
          rationale: ["Flat pricing mirrors volume rather than value."],
          isRecommended: false
        },
        {
          id: "included_allowance",
          name: "Included Allowance Model",
          description: "Add included credits without value weighting.",
          revenueIndex: 109,
          predictabilityScore: 75,
          churnRiskScore: 30,
          implementationComplexityScore: 34,
          churnRiskLabel: "Moderate",
          implementationComplexityLabel: "Moderate",
          fitSegment: "Support-led growth accounts.",
          pros: ["Improves predictability."],
          cons: ["Still under-segments value."],
          estimatedMonthlyRevenue: Math.round((revenue.actualRevenue / 6) * 1.09),
          rationale: ["Allowance improves adoption posture but not value capture."],
          isRecommended: false
        },
        {
          id: "value_weighted_hybrid",
          name: "Value-Weighted Hybrid Model",
          description: "Included credits plus weighted overages by action class.",
          revenueIndex: 119,
          predictabilityScore: 81,
          churnRiskScore: 24,
          implementationComplexityScore: 46,
          churnRiskLabel: "Low",
          implementationComplexityLabel: "Moderate",
          fitSegment: "Mid-market and enterprise e-commerce brands",
          pros: ["Captures more value.", "Preserves predictability."],
          cons: ["Requires meter setup."],
          estimatedMonthlyRevenue: Math.round(revenue.simulatedRevenue / 6),
          rationale: ["Balances value capture and predictability."],
          isRecommended: true
        }
      ],
      rolloutHighlights: [
        "Start with growth accounts.",
        "Validate invoice simulation.",
        "Hold enterprise on dry run until finance sign-off."
      ],
      methodology: "Sample mode deterministic analysis."
    },
    metadata: {
      sampleMode: true,
      sourceMode: "sample",
      generatedAt: new Date().toISOString(),
      dryRunBilling: true
    }
  };
}
