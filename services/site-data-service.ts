import { isSampleMode } from "@/lib/env";
import {
  listCustomers,
  listInvoices,
  listItemFamilies,
  listItemPrices,
  listItems,
  listSubscriptions,
  listUsages,
  type ChargebeeCustomer,
  type ChargebeeInvoice,
  type ChargebeeItem,
  type ChargebeeItemFamily,
  type ChargebeeItemPrice,
  type ChargebeeSubscription
} from "@/lib/providers/chargebee";

export interface SiteDataSnapshot {
  customers: ChargebeeCustomer[];
  subscriptions: ChargebeeSubscription[];
  invoices: ChargebeeInvoice[];
  itemPrices: ChargebeeItemPrice[];
  items: ChargebeeItem[];
  itemFamilies: ChargebeeItemFamily[];
  usages: Record<string, unknown>[];
}

let cache:
  | {
      expiresAt: number;
      promise: Promise<SiteDataSnapshot>;
    }
  | undefined;

async function loadSiteData(): Promise<SiteDataSnapshot> {
  const [customers, subscriptions, invoices, itemPrices, items, itemFamilies, usages] =
    await Promise.all([
      listCustomers(),
      listSubscriptions(),
      listInvoices(),
      listItemPrices(),
      listItems(),
      listItemFamilies(),
      listUsages()
    ]);

  return {
    customers,
    subscriptions,
    invoices,
    itemPrices,
    items,
    itemFamilies,
    usages
  };
}

export async function getSiteDataSnapshot() {
  if (isSampleMode()) {
    return null;
  }

  if (cache && cache.expiresAt > Date.now()) {
    return cache.promise;
  }

  cache = {
    expiresAt: Date.now() + 60_000,
    promise: loadSiteData()
  };

  return cache.promise;
}
