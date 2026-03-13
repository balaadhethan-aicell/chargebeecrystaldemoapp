import type { CatalogPlanSummary, UsageBucketSummary, ValueBucketId, ValueSurfaceRow } from "@/types/monetization";

export const VALUE_BUCKET_CONFIG: Record<
  ValueBucketId,
  {
    label: string;
    weight: number;
    valuePerAction: number;
    actionsPerRevenueDollar: number;
    keywords: string[];
  }
> = {
  support_deflection: {
    label: "Support Deflection",
    weight: 1,
    valuePerAction: 0.18,
    actionsPerRevenueDollar: 3.6,
    keywords: ["support", "faq", "ticket", "tracking", "starter", "individual"]
  },
  operational_actions: {
    label: "Operational Actions",
    weight: 3,
    valuePerAction: 0.62,
    actionsPerRevenueDollar: 1.8,
    keywords: ["return", "refund", "edit", "subscription", "duo", "family", "ops"]
  },
  revenue_actions: {
    label: "Revenue Actions",
    weight: 6,
    valuePerAction: 1.48,
    actionsPerRevenueDollar: 1.2,
    keywords: ["discount", "recommend", "purchase", "fan", "premium", "plus", "upsell", "hifi"]
  }
};

const PRIORITY_BY_BUCKET: ValueBucketId[] = [
  "revenue_actions",
  "operational_actions",
  "support_deflection"
];

export const GORGIAS_VALUE_SURFACES: ValueSurfaceRow[] = [
  {
    bucket: "Support Deflection",
    buyer: "Support operations",
    outcome: "FAQ resolution and order tracking automation",
    monetizationGap: "High-frequency tickets dominate billing weight even when customer willingness to pay is modest.",
    pricingShape: "Keep entry friction low with low-weight credits inside an allowance."
  },
  {
    bucket: "Operational Actions",
    buyer: "CX and operations leads",
    outcome: "Returns, refunds, order edits, and subscription changes",
    monetizationGap: "Operational workflows save labor and increase retention but are under-segmented by a flat fee.",
    pricingShape: "Use medium-weight credits with predictable included capacity."
  },
  {
    bucket: "Revenue Actions",
    buyer: "Growth and digital commerce",
    outcome: "Discount orchestration, product recommendations, and purchase-driving interventions",
    monetizationGap: "Revenue-driving actions create the clearest ROI but are priced the same as low-intent support flows.",
    pricingShape: "Assign the heaviest credit weight and meter overages transparently."
  }
];

export function classifyCatalogEntry(entry: Pick<CatalogPlanSummary, "name" | "externalName" | "description" | "itemType" | "normalizedSegment">): ValueBucketId {
  const text = [entry.name, entry.externalName, entry.description, entry.normalizedSegment, entry.itemType]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const bucketId of PRIORITY_BY_BUCKET) {
    if (VALUE_BUCKET_CONFIG[bucketId].keywords.some((keyword) => text.includes(keyword))) {
      return bucketId;
    }
  }

  if (entry.itemType === "plan") {
    return "support_deflection";
  }

  if (entry.normalizedSegment === "enterprise") {
    return "revenue_actions";
  }

  return "operational_actions";
}

export function normalizeBucketShares(buckets: UsageBucketSummary[]) {
  const totalUsage = buckets.reduce((sum, bucket) => sum + bucket.inferredActions, 0) || 1;
  const totalRevenue = buckets.reduce((sum, bucket) => sum + bucket.actualRevenue, 0) || 1;
  const totalValue = buckets.reduce(
    (sum, bucket) => sum + bucket.inferredActions * VALUE_BUCKET_CONFIG[bucket.bucketId].valuePerAction,
    0
  ) || 1;

  return buckets.map((bucket) => ({
    ...bucket,
    usageSharePct: Number(((bucket.inferredActions / totalUsage) * 100).toFixed(1)),
    currentRevenueSharePct: Number(((bucket.actualRevenue / totalRevenue) * 100).toFixed(1)),
    modeledValueSharePct: Number(
      (((bucket.inferredActions * VALUE_BUCKET_CONFIG[bucket.bucketId].valuePerAction) / totalValue) * 100).toFixed(1)
    )
  }));
}
