import { AppError } from "@/lib/errors";
import { type ChargebeeItemPrice } from "@/lib/providers/chargebee";
import { getSiteDataSnapshot } from "@/services/site-data-service";
import { getSampleCatalogSummary } from "@/services/sample-mode-service";
import type { CatalogPlanSummary, CatalogSummary } from "@/types/monetization";

function normalizeSegment(index: number, total: number): "starter" | "growth" | "enterprise" {
  if (total <= 1) {
    return "growth";
  }

  if (index === total - 1) {
    return "enterprise";
  }

  if (index === 0) {
    return "starter";
  }

  return "growth";
}

function normalizeItemPrice(entry: ChargebeeItemPrice, index: number, totalPlans: number): CatalogPlanSummary {
  const itemType =
    entry.item_type === "plan" || entry.item_type === "addon" || entry.item_type === "charge"
      ? entry.item_type
      : "unknown";

  return {
    itemPriceId: entry.id,
    itemId: entry.item_id,
    familyId: entry.item_family_id,
    name: entry.name,
    externalName: entry.external_name ?? entry.name,
    description: entry.description,
    amount: (entry.price ?? 0) / 100,
    currencyCode: entry.currency_code ?? "USD",
    periodUnit: entry.period_unit ?? "month",
    itemType,
    normalizedSegment: normalizeSegment(index, totalPlans)
  };
}

export async function getCatalogSummary(): Promise<CatalogSummary> {
  const snapshot = await getSiteDataSnapshot();

  if (!snapshot) {
    return getSampleCatalogSummary();
  }

  if (snapshot.itemPrices.length === 0) {
    throw new AppError("No Chargebee item prices were found. Populate catalog data before running analysis.", {
      code: "catalog_empty",
      status: 404
    });
  }

  const sortedPlans = snapshot.itemPrices
    .filter((entry) => entry.item_type === "plan")
    .sort((left, right) => (left.price ?? 0) - (right.price ?? 0));

  const plans = sortedPlans.map((entry, index) => normalizeItemPrice(entry, index, sortedPlans.length));
  const addOns = snapshot.itemPrices
    .filter((entry) => entry.item_type !== "plan")
    .sort((left, right) => (left.price ?? 0) - (right.price ?? 0))
    .map((entry, index) => normalizeItemPrice(entry, index + 1, Math.max(3, sortedPlans.length)));

  const currentPricingModel = snapshot.itemPrices.some((entry) => entry.pricing_model?.includes("per_unit"))
    ? "usage"
    : snapshot.itemPrices.some((entry) => entry.item_type !== "plan")
      ? "hybrid"
      : "flat";

  return {
    currencyCode: plans[0]?.currencyCode ?? addOns[0]?.currencyCode ?? "USD",
    plans,
    addOns,
    currentPricingModel,
    notes: [
      "Catalog data is loaded live from Chargebee item prices and normalized into starter, growth, and enterprise tiers.",
      "If plan names do not map cleanly to B2B segments, Monetization Twin assigns tiers by relative price level."
    ]
  };
}
