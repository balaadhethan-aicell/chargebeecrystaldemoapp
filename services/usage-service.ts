import { classifyCatalogEntry, normalizeBucketShares, VALUE_BUCKET_CONFIG } from "@/lib/value-buckets";
import { getAccountSummary } from "@/services/account-service";
import { getCatalogSummary } from "@/services/catalog-service";
import { getSampleUsageSummary } from "@/services/sample-mode-service";
import { getSiteDataSnapshot } from "@/services/site-data-service";
import type { AccountId, UsageSeriesPoint, UsageSummary, ValueBucketId } from "@/types/monetization";

function monthKeyFromUnix(timestamp: number) {
  const date = new Date(timestamp * 1000);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function buildMonthRange(months: number) {
  const entries: string[] = [];
  const cursor = new Date();
  cursor.setUTCDate(1);
  cursor.setUTCHours(0, 0, 0, 0);

  for (let index = months - 1; index >= 0; index -= 1) {
    const value = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - index, 1));
    entries.push(`${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`);
  }

  return entries;
}

function inferFromAmount(bucketId: ValueBucketId, revenueAmount: number) {
  const config = VALUE_BUCKET_CONFIG[bucketId];
  const inferredActions = Math.max(1, Math.round(revenueAmount * config.actionsPerRevenueDollar));

  return {
    inferredActions,
    weightedCredits: inferredActions * config.weight
  };
}

export async function getUsageSummary(accountId: AccountId = "gorgias"): Promise<UsageSummary> {
  const snapshot = await getSiteDataSnapshot();

  if (!snapshot) {
    return getSampleUsageSummary(accountId);
  }

  const [account, catalog] = await Promise.all([getAccountSummary(accountId), getCatalogSummary()]);
  const months = buildMonthRange(12);
  const itemPriceMap = new Map(catalog.plans.concat(catalog.addOns).map((entry) => [entry.itemPriceId, entry]));
  const invoices = snapshot.invoices.filter(
    (invoice) => invoice.customer_id === account.backingCustomerId || account.resolutionMode === "adapter_inferred"
  );
  const subscriptions = snapshot.subscriptions.filter(
    (subscription) =>
      subscription.customer_id === account.backingCustomerId || account.resolutionMode === "adapter_inferred"
  );

  const currentRecurringRevenue =
    subscriptions.reduce((sum, subscription) => sum + (subscription.mrr ?? 0), 0) / 100;
  const method: UsageSummary["method"] =
    snapshot.usages.length > 0
      ? "metered_usage"
      : invoices.length > 0
        ? "invoice_inference"
        : "subscription_inference";

  const monthlySeries = new Map<string, UsageSeriesPoint>(
    months.map((month) => [
      month,
      {
        month,
        actualRevenue: 0,
        baseRecurringRevenue: currentRecurringRevenue,
        supportDeflection: 0,
        operationalActions: 0,
        revenueActions: 0
      }
    ])
  );

  if (invoices.length > 0) {
    for (const invoice of invoices) {
      const key = monthKeyFromUnix(invoice.date ?? invoice.generated_at ?? Math.floor(Date.now() / 1000));
      const point = monthlySeries.get(key);

      if (!point) {
        continue;
      }

      point.actualRevenue += (invoice.total ?? 0) / 100;

      for (const lineItem of invoice.line_items ?? []) {
        const catalogEntry = itemPriceMap.get(lineItem.entity_id ?? "");
        const bucketId = classifyCatalogEntry(
          catalogEntry ?? {
            name: lineItem.description ?? "Unknown line item",
            externalName: lineItem.description ?? "Unknown line item",
            description: lineItem.description,
            itemType: lineItem.entity_type?.includes("addon") ? "addon" : "plan",
            normalizedSegment: "growth"
          }
        );
        const amount = (lineItem.amount ?? 0) / 100;
        const inferred = inferFromAmount(bucketId, amount);

        if (bucketId === "support_deflection") {
          point.supportDeflection += inferred.inferredActions;
        } else if (bucketId === "operational_actions") {
          point.operationalActions += inferred.inferredActions;
        } else {
          point.revenueActions += inferred.inferredActions;
        }
      }
    }
  }

  if (method === "subscription_inference" || [...monthlySeries.values()].every((point) => point.actualRevenue === 0)) {
    for (const point of monthlySeries.values()) {
      point.actualRevenue = currentRecurringRevenue;
    }

    for (const subscription of subscriptions) {
      for (const item of subscription.subscription_items ?? []) {
        const catalogEntry = itemPriceMap.get(item.item_price_id);

        if (!catalogEntry) {
          continue;
        }

        const bucketId = classifyCatalogEntry(catalogEntry);
        const amount = ((item.amount ?? item.unit_price ?? 0) / 100) * (item.quantity ?? 1);
        const inferred = inferFromAmount(bucketId, amount);

        for (const point of monthlySeries.values()) {
          if (bucketId === "support_deflection") {
            point.supportDeflection += inferred.inferredActions;
          } else if (bucketId === "operational_actions") {
            point.operationalActions += inferred.inferredActions;
          } else {
            point.revenueActions += inferred.inferredActions;
          }
        }
      }
    }
  }

  const bucketAggregates = {
    support_deflection: {
      bucketId: "support_deflection" as const,
      label: VALUE_BUCKET_CONFIG.support_deflection.label,
      inferredActions: 0,
      weightedCredits: 0,
      actualRevenue: 0,
      simulatedRevenue: 0,
      currentRevenueSharePct: 0,
      modeledValueSharePct: 0,
      usageSharePct: 0,
      method
    },
    operational_actions: {
      bucketId: "operational_actions" as const,
      label: VALUE_BUCKET_CONFIG.operational_actions.label,
      inferredActions: 0,
      weightedCredits: 0,
      actualRevenue: 0,
      simulatedRevenue: 0,
      currentRevenueSharePct: 0,
      modeledValueSharePct: 0,
      usageSharePct: 0,
      method
    },
    revenue_actions: {
      bucketId: "revenue_actions" as const,
      label: VALUE_BUCKET_CONFIG.revenue_actions.label,
      inferredActions: 0,
      weightedCredits: 0,
      actualRevenue: 0,
      simulatedRevenue: 0,
      currentRevenueSharePct: 0,
      modeledValueSharePct: 0,
      usageSharePct: 0,
      method
    }
  };

  for (const point of monthlySeries.values()) {
    const supportRevenue = point.actualRevenue * 0.56;
    const operationalRevenue = point.actualRevenue * 0.26;
    const revenueActionsRevenue = point.actualRevenue * 0.18;

    bucketAggregates.support_deflection.inferredActions += point.supportDeflection;
    bucketAggregates.support_deflection.actualRevenue += supportRevenue;
    bucketAggregates.support_deflection.weightedCredits += point.supportDeflection;

    bucketAggregates.operational_actions.inferredActions += point.operationalActions;
    bucketAggregates.operational_actions.actualRevenue += operationalRevenue;
    bucketAggregates.operational_actions.weightedCredits += point.operationalActions * 3;

    bucketAggregates.revenue_actions.inferredActions += point.revenueActions;
    bucketAggregates.revenue_actions.actualRevenue += revenueActionsRevenue;
    bucketAggregates.revenue_actions.weightedCredits += point.revenueActions * 6;
  }

  return {
    currencyCode: account.currencyCode,
    method,
    hasUsageRecords: snapshot.usages.length > 0,
    buckets: normalizeBucketShares(Object.values(bucketAggregates)),
    monthlySeries: [...monthlySeries.values()],
    notes: [
      method === "metered_usage"
        ? "Chargebee usage records were available and are used as the primary usage signal."
        : method === "invoice_inference"
          ? "Chargebee invoices were available, but usage records were not. Action volume is inferred from invoice line items and catalog metadata."
          : "Chargebee usage and invoice history were sparse. Action volume is inferred from current subscription items and recurring revenue.",
      "Value buckets are normalized into Support Deflection, Operational Actions, and Revenue Actions using deterministic heuristics."
    ]
  };
}
