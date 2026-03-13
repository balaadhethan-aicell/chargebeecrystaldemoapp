import { z } from "zod";
import { getEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

const listEnvelopeSchema = z.object({
  list: z.array(z.record(z.unknown())),
  next_offset: z.string().nullable().optional()
});

export interface ChargebeeCustomer {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  company?: string;
  preferred_currency_code?: string;
  mrr?: number;
}

export interface ChargebeeSubscription {
  id: string;
  customer_id: string;
  status: string;
  currency_code?: string;
  mrr?: number;
  created_at?: number;
  updated_at?: number;
  subscription_items?: Array<{
    item_price_id: string;
    item_type?: string;
    quantity?: number;
    amount?: number;
    unit_price?: number;
  }>;
}

export interface ChargebeeInvoice {
  id: string;
  customer_id?: string;
  subscription_id?: string;
  currency_code?: string;
  total?: number;
  amount_paid?: number;
  amount_due?: number;
  generated_at?: number;
  date?: number;
  status?: string;
  line_items?: Array<{
    entity_id?: string;
    entity_type?: string;
    description?: string;
    quantity?: number;
    amount?: number;
    unit_amount?: number;
  }>;
}

export interface ChargebeeItemPrice {
  id: string;
  item_id: string;
  item_family_id?: string;
  name: string;
  external_name?: string;
  description?: string;
  item_type?: string;
  pricing_model?: string;
  price?: number;
  currency_code?: string;
  period?: number;
  period_unit?: string;
  free_quantity?: number;
}

export interface ChargebeeItem {
  id: string;
  name?: string;
  description?: string;
  item_family_id?: string;
  type?: string;
}

export interface ChargebeeItemFamily {
  id: string;
  name?: string;
  description?: string;
}

function baseUrl() {
  return `https://${getEnv().CHARGEBEE_SITE}.chargebee.com/api/v2`;
}

function authHeader() {
  return `Basic ${Buffer.from(`${getEnv().CHARGEBEE_API_KEY}:`).toString("base64")}`;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${baseUrl()}${path}`;
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: authHeader(),
        ...(init?.headers ?? {})
      },
      cache: "no-store"
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};

    logger.info("chargebee.request", {
      path,
      status: response.status,
      durationMs: Date.now() - startedAt
    });

    if (!response.ok) {
      throw new AppError(payload.api_error_msg ?? "Chargebee request failed", {
        code: payload.api_error_code ?? "chargebee_request_failed",
        status: response.status
      });
    }

    return payload as T;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error("chargebee.request_failed", {
      path,
      message: error instanceof Error ? error.message : "Unknown error"
    });

    throw new AppError("Unable to reach Chargebee. Check CHARGEBEE_SITE and CHARGEBEE_API_KEY.", {
      code: "chargebee_unavailable",
      status: 502
    });
  }
}

async function listAll<T>(path: string, resourceKey: string, limit = 100) {
  const results: T[] = [];
  let offset: string | undefined;
  let page = 0;

  while (page < 5) {
    const query = new URLSearchParams({ limit: String(limit) });
    if (offset) {
      query.set("offset", offset);
    }

    const payload = listEnvelopeSchema.parse(await requestJson(`${path}?${query.toString()}`));

    for (const entry of payload.list) {
      const candidate = entry[resourceKey];
      if (candidate && typeof candidate === "object") {
        results.push(candidate as T);
      }
    }

    if (!payload.next_offset) {
      break;
    }

    offset = payload.next_offset;
    page += 1;
  }

  return results;
}

export async function listCustomers() {
  return listAll<ChargebeeCustomer>("/customers", "customer");
}

export async function listSubscriptions() {
  return listAll<ChargebeeSubscription>("/subscriptions", "subscription");
}

export async function listInvoices() {
  return listAll<ChargebeeInvoice>("/invoices", "invoice");
}

export async function listItemPrices() {
  return listAll<ChargebeeItemPrice>("/item_prices", "item_price");
}

export async function listItems() {
  return listAll<ChargebeeItem>("/items", "item");
}

export async function listItemFamilies() {
  return listAll<ChargebeeItemFamily>("/item_families", "item_family");
}

export async function listUsages() {
  return listAll<Record<string, unknown>>("/usages", "usage");
}

function appendFormData(form: URLSearchParams, prefix: string, value: unknown) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => appendFormData(form, `${prefix}[${index}]`, entry));
    return;
  }

  if (typeof value === "object") {
    for (const [key, childValue] of Object.entries(value)) {
      appendFormData(form, `${prefix}[${key}]`, childValue);
    }
    return;
  }

  form.append(prefix, String(value));
}

export async function postForm<T>(path: string, payload: Record<string, unknown>) {
  const form = new URLSearchParams();

  for (const [key, value] of Object.entries(payload)) {
    appendFormData(form, key, value);
  }

  return requestJson<T>(path, {
    method: "POST",
    body: form.toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
}
