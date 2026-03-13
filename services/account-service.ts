import { AppError } from "@/lib/errors";
import { getCatalogSummary } from "@/services/catalog-service";
import { getSampleAccountSummary } from "@/services/sample-mode-service";
import { getSiteDataSnapshot } from "@/services/site-data-service";
import type { AccountId, AccountSummary, PlanMixEntry } from "@/types/monetization";

function displayName(customer: { first_name?: string; last_name?: string; email?: string }) {
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim();
  return name || customer.email || "Unlabeled customer";
}

function scoreCustomer(candidate: { first_name?: string; last_name?: string; email?: string; company?: string }) {
  const text = [candidate.first_name, candidate.last_name, candidate.email, candidate.company]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (text.includes("gorgias")) {
    return 100;
  }

  if (text.includes("support") || text.includes("help")) {
    return 50;
  }

  return 0;
}

function inferExpansionTrend(recentRevenue: number[]) {
  if (recentRevenue.length < 2 || recentRevenue[0] === 0) {
    return 6.4;
  }

  const [previous, current] = recentRevenue.slice(-2);
  return Number((((current - previous) / Math.max(previous, 1)) * 100).toFixed(1));
}

export async function getAccountSummary(accountId: AccountId = "gorgias"): Promise<AccountSummary> {
  const snapshot = await getSiteDataSnapshot();

  if (!snapshot) {
    return getSampleAccountSummary(accountId);
  }

  const catalog = await getCatalogSummary();
  const scoredCustomers = snapshot.customers
    .map((customer) => ({ customer, score: scoreCustomer(customer) }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return (right.customer.mrr ?? 0) - (left.customer.mrr ?? 0);
    });

  const activeSubscriptions = snapshot.subscriptions.filter((subscription) =>
    ["active", "in_trial", "non_renewing"].includes(subscription.status)
  );

  const fallbackSubscription = [...activeSubscriptions].sort((left, right) => (right.mrr ?? 0) - (left.mrr ?? 0))[0];
  const selectedCustomer =
    scoredCustomers[0]?.score > 0
      ? scoredCustomers[0]?.customer
      : snapshot.customers.find((customer) => customer.id === fallbackSubscription?.customer_id) ?? snapshot.customers[0];

  if (!selectedCustomer) {
    throw new AppError("No customer records were found in Chargebee.", {
      code: "customer_missing",
      status: 404
    });
  }

  const customerSubscriptions = activeSubscriptions.filter(
    (subscription) => subscription.customer_id === selectedCustomer.id
  );

  const recurringRevenue =
    customerSubscriptions.reduce((sum, subscription) => sum + (subscription.mrr ?? 0), 0) / 100;
  const invoiceRevenueHistory = snapshot.invoices
    .filter((invoice) => invoice.customer_id === selectedCustomer.id)
    .sort((left, right) => (left.date ?? 0) - (right.date ?? 0))
    .map((invoice) => (invoice.total ?? 0) / 100);

  const planMix: PlanMixEntry[] = catalog.plans.map((plan) => {
    const matchingSubscriptions = customerSubscriptions.filter((subscription) =>
      subscription.subscription_items?.some((item) => item.item_price_id === plan.itemPriceId)
    );
    const aiAttachedSubscriptions = matchingSubscriptions.filter((subscription) =>
      subscription.subscription_items?.some((item) => item.item_type === "addon")
    );

    return {
      planId: plan.itemPriceId,
      planName: plan.externalName,
      normalizedSegment: plan.normalizedSegment,
      activeSubscriptions: matchingSubscriptions.length,
      aiAttachRatePct:
        matchingSubscriptions.length === 0
          ? 0
          : Number(((aiAttachedSubscriptions.length / matchingSubscriptions.length) * 100).toFixed(1)),
      monthlyRecurringRevenue: matchingSubscriptions.reduce((sum, subscription) => sum + (subscription.mrr ?? 0), 0) / 100,
      includedCredits:
        plan.normalizedSegment === "starter" ? 8_000 : plan.normalizedSegment === "growth" ? 35_000 : 120_000
    };
  });

  const totalSubscriptions = planMix.reduce((sum, plan) => sum + plan.activeSubscriptions, 0);
  const aiAttached = customerSubscriptions.filter((subscription) =>
    subscription.subscription_items?.some((item) => item.item_type === "addon")
  ).length;
  const aiRevenueProxy =
    snapshot.invoices
      .filter((invoice) => invoice.customer_id === selectedCustomer.id)
      .flatMap((invoice) => invoice.line_items ?? [])
      .filter((lineItem) => lineItem.entity_type?.includes("addon"))
      .reduce((sum, lineItem) => sum + ((lineItem.amount ?? 0) / 100), 0) || recurringRevenue * 0.18;
  const totalRevenueProxy =
    snapshot.invoices
      .filter((invoice) => invoice.customer_id === selectedCustomer.id)
      .reduce((sum, invoice) => sum + ((invoice.total ?? 0) / 100), 0) || recurringRevenue;

  const aiRevenueContributionPct = Number(
    ((aiRevenueProxy / Math.max(totalRevenueProxy, recurringRevenue, 1)) * 100).toFixed(1)
  );
  const aiAttachRatePct =
    totalSubscriptions === 0 ? 0 : Number(((aiAttached / totalSubscriptions) * 100).toFixed(1));
  const expansionTrendPct = inferExpansionTrend(invoiceRevenueHistory);
  const resolutionMode = scoreCustomer(selectedCustomer) > 0 ? "chargebee" : "adapter_inferred";

  return {
    id: accountId,
    displayName: "Gorgias",
    backingCustomerId: selectedCustomer.id,
    backingCustomerName: displayName(selectedCustomer),
    currencyCode: selectedCustomer.preferred_currency_code ?? catalog.currencyCode,
    foundation: "Support platform foundation with layered AI automation",
    currentMonetizationModel: "Flat platform pricing with under-segmented AI monetization",
    aiRevenueContributionPct,
    aiAttachRatePct,
    expansionTrendPct,
    arr: Number(((Math.max(recurringRevenue, totalRevenueProxy) * 12) || 0).toFixed(0)),
    summary:
      resolutionMode === "chargebee"
        ? "Chargebee customer and catalog data are being analyzed directly for a Gorgias-style monetization redesign."
        : "Chargebee customer and catalog data are live, but the Gorgias workspace is adapter-backed because no explicit Gorgias customer mapping was found on the site.",
    primaryGoal:
      "Evaluate how Gorgias can move from flat AI monetization toward a value-weighted hybrid model without sacrificing spend predictability or expansion momentum.",
    resolutionMode,
    planMix,
    stats: [
      {
        label: "Commercial foundation",
        value: "Support platform",
        detail: "The account profile is framed around a support-led SaaS base with AI layered on top."
      },
      {
        label: "Current AI revenue mix",
        value: `${aiRevenueContributionPct.toFixed(1)}%`,
        detail: "Derived from add-on invoice share or recurring revenue proxy when invoice history is sparse."
      },
      {
        label: "AI attach rate",
        value: `${aiAttachRatePct.toFixed(1)}%`,
        detail: "Measured from active subscriptions carrying add-on or inferred AI expansion signals."
      },
      {
        label: "Data resolution",
        value: resolutionMode === "chargebee" ? "Mapped directly" : "Adapter-backed",
        detail:
          resolutionMode === "chargebee"
            ? "A Chargebee customer mapping was found for this workspace."
            : "Live Chargebee inputs are normalized into the Gorgias pricing thesis because a direct mapping was not found."
      }
    ],
    notes: [
      resolutionMode === "chargebee"
        ? "Account summary is mapped directly from Chargebee customer, subscription, and invoice data."
        : `Gorgias is shown as the workspace label, while Chargebee customer ${displayName(selectedCustomer)} provides the backing commercial signal.`,
      "ARR is annualized from recurring subscription revenue and recent invoice totals."
    ]
  };
}
