import { getAccountSummary } from "@/services/account-service";
import { getCatalogSummary } from "@/services/catalog-service";
import { getSampleBillingDraft, getSampleBillingPreview, getSampleBillingExecutionResult } from "@/services/sample-mode-service";
import { postForm } from "@/lib/providers/chargebee";
import { getEnv, isSampleMode } from "@/lib/env";
import { logger } from "@/lib/logger";
import type {
  AccountId,
  BillingDraft,
  BillingDraftExecutionResult,
  BillingDraftPreview
} from "@/types/monetization";

const INCLUDED_CREDITS = {
  starter: 8_000,
  growth: 35_000,
  enterprise: 120_000
} as const;

const PRICE_MULTIPLIER = {
  starter: 1.12,
  growth: 1.18,
  enterprise: 1.24
} as const;

export async function getBillingDraft(accountId: AccountId = "gorgias"): Promise<BillingDraft> {
  if (isSampleMode()) {
    return getSampleBillingDraft(accountId);
  }

  const [account, catalog] = await Promise.all([getAccountSummary(accountId), getCatalogSummary()]);

  return {
    itemFamilyId: "ai_monetization",
    itemFamilyName: "AI Monetization",
    currencyCode: account.currencyCode,
    plans: catalog.plans.map((plan) => ({
      id: `hybrid-${plan.itemPriceId}`,
      planName: `${plan.externalName} + AI Credits`,
      currentItemPriceId: plan.itemPriceId,
      normalizedSegment: plan.normalizedSegment,
      currentPrice: plan.amount,
      proposedPrice: Number((plan.amount * PRICE_MULTIPLIER[plan.normalizedSegment]).toFixed(2)),
      includedCredits: INCLUDED_CREDITS[plan.normalizedSegment],
      targetSegment:
        plan.normalizedSegment === "starter"
          ? "Lower-friction entry pricing for support teams adopting AI for deflection and simple operations."
          : plan.normalizedSegment === "growth"
            ? "Mid-market teams scaling into returns, refunds, and workflow operations."
            : "High-volume accounts monetizing revenue-driving AI intent with contract guardrails.",
      updateSummary:
        plan.normalizedSegment === "enterprise"
          ? "Keep annual commit structure and add weighted credits with finance controls."
          : "Convert the plan into an included-credit package with value-aware overages."
    })),
    proposedAddOns: [
      {
        id: "ai-revenue-actions-pack",
        name: "Revenue Actions Pack",
        pricing: `${account.currencyCode} 0.67 per weighted credit over allowance`,
        purpose: "Captures high-value discounts, recommendations, and purchase-driving AI events."
      },
      {
        id: "ai-ops-booster",
        name: "Ops Automation Booster",
        pricing: `${account.currencyCode} 0.38 per weighted credit over allowance`,
        purpose: "Adds deterministic headroom for operational AI workflows without repackaging the full contract."
      }
    ],
    meters: [
      {
        id: "weighted_ai_credits",
        name: "Weighted AI Credits",
        unit: "weighted credits",
        ratingLogic: "Allowance resets monthly; overage is true-upped against weighted demand."
      },
      {
        id: "support_deflection_actions",
        name: "Support Deflection Actions",
        unit: "actions",
        ratingLogic: "1 credit per action"
      },
      {
        id: "operational_actions",
        name: "Operational Actions",
        unit: "actions",
        ratingLogic: "3 credits per action"
      },
      {
        id: "revenue_actions",
        name: "Revenue Actions",
        unit: "actions",
        ratingLogic: "6 credits per action"
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
        rule: "Allowance threshold alerts",
        detail: "Notify admins at 80% and 95% of included weighted credits."
      },
      {
        rule: "Overage invoicing",
        detail: "Bill weighted credit overage monthly and expose value-class meters on invoice detail."
      },
      {
        rule: "Enterprise governance",
        detail: "Require finance sign-off before enabling uncapped revenue-action expansion for enterprise tiers."
      }
    ],
    notes: [
      "Billing Draft is generated from live Chargebee plan pricing and normalized into Chargebee-compatible plan updates.",
      "Enterprise is included by default but can be excluded from the execution preview without affecting recommendation logic."
    ]
  };
}

export async function previewBillingDraft(
  accountId: AccountId,
  includedSegments: Array<"starter" | "growth" | "enterprise">
): Promise<BillingDraftPreview> {
  if (isSampleMode()) {
    return getSampleBillingPreview(accountId, includedSegments);
  }

  const draft = await getBillingDraft(accountId);
  const filteredPlans = draft.plans.filter((plan) => includedSegments.includes(plan.normalizedSegment));
  const excludedSegments = (["starter", "growth", "enterprise"] as const).filter(
    (segment) => !includedSegments.includes(segment)
  );

  logger.info("billing_draft.preview", {
    accountId,
    includedSegments,
    planCount: filteredPlans.length
  });

  return {
    includedSegments,
    excludedSegments,
    planCount: filteredPlans.length,
    mode: getEnv().BILLING_DRAFT_APPLY_MODE ? "apply" : "dry_run",
    summary:
      excludedSegments.length > 0
        ? `Previewing ${filteredPlans.length} plan updates with ${excludedSegments.join(", ")} excluded from execution scope.`
        : `Previewing ${filteredPlans.length} plan updates across the full starter, growth, and enterprise scope.`,
    payloadPreview: {
      itemFamilyId: draft.itemFamilyId,
      planUpdates: filteredPlans.map((plan) => ({
        segment: plan.normalizedSegment,
        itemPriceId: plan.currentItemPriceId,
        proposedPrice: plan.proposedPrice,
        includedCredits: plan.includedCredits
      })),
      meterIds: draft.meters.map((meter) => meter.id)
    },
    notes: [
      "Preview output is safe to share publicly. No write operation occurs until execute is confirmed.",
      excludedSegments.length > 0
        ? "Excluded plans are removed from the payload preview only; they do not change recommendation or revenue impact calculations."
        : "All normalized plan tiers are included in the draft scope."
    ]
  };
}

export async function executeBillingDraft(
  accountId: AccountId,
  includedSegments: Array<"starter" | "growth" | "enterprise">
): Promise<BillingDraftExecutionResult> {
  if (isSampleMode()) {
    return getSampleBillingExecutionResult(accountId, includedSegments);
  }

  const env = getEnv();
  const preview = await previewBillingDraft(accountId, includedSegments);

  if (env.BILLING_DRAFT_DRY_RUN || !env.BILLING_DRAFT_APPLY_MODE) {
    return {
      mode: "dry_run",
      dryRun: true,
      success: true,
      message: "Billing draft execution completed in dry-run mode. No Chargebee write operations were performed.",
      operations: preview.payloadPreview.planUpdates.map((plan) => ({
        type: "plan_update",
        status: "simulated",
        target: `${plan.segment}:${plan.itemPriceId ?? "new_item_price"}`
      }))
    };
  }

  const operations: BillingDraftExecutionResult["operations"] = [];

  for (const plan of preview.payloadPreview.planUpdates) {
    if (!plan.itemPriceId) {
      operations.push({
        type: "plan_update",
        status: "skipped",
        target: `${plan.segment}:missing_item_price`
      });
      continue;
    }

    await postForm(`/item_prices/${plan.itemPriceId}`, {
      price: Math.round(plan.proposedPrice * 100)
    });

    operations.push({
      type: "item_price",
      status: "applied",
      target: plan.itemPriceId
    });
  }

  logger.info("billing_draft.execute", {
    accountId,
    includedSegments,
    operations: operations.length
  });

  return {
    mode: "apply",
    dryRun: false,
    success: true,
    message: "Billing draft execution applied the selected Chargebee item price updates.",
    operations
  };
}
