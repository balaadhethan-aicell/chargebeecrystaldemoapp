# Chargebee Crystal

Chargebee Crystal is a Chargebee-native internal concept for redesigning AI monetization. It connects to Chargebee server-side, normalizes catalog, customer, subscription, usage, and invoice inputs into a Gorgias-oriented monetization workspace, computes a deterministic pricing recommendation, replays historical revenue under a value-weighted hybrid model, and prepares a dry-run-safe billing draft.

The app preserves the original product thesis:
- Gorgias has a support-platform foundation
- AI monetization is layered on top
- flat outcome pricing under-segments value
- the recommended next step is a value-weighted hybrid model with included credits and weighted overages


## What Chargebee Crystal does

The app walks through six product views:
- `Overview`: account posture, current monetization model, AI contribution, plan mix, and data-resolution notes
- `Diagnosis`: value-bucket misalignment, pricing signals, and value-surface mapping
- `Recommended Model`: deterministic scenario comparison with a recommended winner
- `Revenue Impact`: historical replay for `3m`, `6m`, or `12m`
- `Exec Memo`: printable leadership summary
- `Billing Draft`: Chargebee-compatible plan update draft with preview and dry-run execution

## Architecture

### UI
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn-style UI primitives
- Recharts

### Providers
- [`lib/providers/chargebee.ts`](/Users/balaadhethan/Documents/New%20project/lib/providers/chargebee.ts)
  Server-side Chargebee adapter for customers, subscriptions, invoices, item prices, items, item families, usage records, and safe form-post writes.
- [`lib/providers/openai.ts`](/Users/balaadhethan/Documents/New%20project/lib/providers/openai.ts)
  OpenAI Responses API adapter using strict JSON schema output validation.

### Domain services
- [`services/account-service.ts`](/Users/balaadhethan/Documents/New%20project/services/account-service.ts)
- [`services/catalog-service.ts`](/Users/balaadhethan/Documents/New%20project/services/catalog-service.ts)
- [`services/usage-service.ts`](/Users/balaadhethan/Documents/New%20project/services/usage-service.ts)
- [`services/monetization-analysis-service.ts`](/Users/balaadhethan/Documents/New%20project/services/monetization-analysis-service.ts)
- [`services/revenue-impact-service.ts`](/Users/balaadhethan/Documents/New%20project/services/revenue-impact-service.ts)
- [`services/billing-draft-service.ts`](/Users/balaadhethan/Documents/New%20project/services/billing-draft-service.ts)
- [`services/memo-service.ts`](/Users/balaadhethan/Documents/New%20project/services/memo-service.ts)

### Normalized domain types
- [`types/monetization.ts`](/Users/balaadhethan/Documents/New%20project/types/monetization.ts)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and populate credentials.

3. Start the app:

```bash
npm run dev
```

4. Open [http://localhost:3000/monetization-twin/gorgias](http://localhost:3000/monetization-twin/gorgias)

## Environment variables

Required:

```bash
CHARGEBEE_SITE=your-chargebee-site-name
CHARGEBEE_API_KEY=your-chargebee-api-key
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5.4
SAMPLE_MODE=false
BILLING_DRAFT_DRY_RUN=true
BILLING_DRAFT_APPLY_MODE=false
```

Behavior:
- `SAMPLE_MODE=false` is the default and is the real runtime path.
- `SAMPLE_MODE=true` switches to the original fixture-backed fallback for local development only.
- `BILLING_DRAFT_DRY_RUN=true` keeps execution preview-only.
- `BILLING_DRAFT_APPLY_MODE=false` prevents live Chargebee writes by default.

## Chargebee integration

### What is real
- Item prices, items, item families, customers, subscriptions, invoices, and usage records are fetched from Chargebee server-side.
- The app never exposes Chargebee secrets to the browser.
- Billing Draft preview and execution routes call server-side services only.

### What is inferred
- If the connected Chargebee site does not contain a directly mappable Gorgias customer, the app creates an adapter-backed Gorgias workspace from the best available live customer/catalog/revenue signals.
- If usage records are missing, the app deterministically infers value-bucket demand from invoice line items and current subscription structure.
- If invoice history is sparse, Revenue Impact backfills missing periods from recurring subscription revenue.

### What requires Chargebee configuration to work fully
- Native metered AI usage records
- A directly mappable Gorgias customer or tenant record
- AI-specific item prices or meters that align cleanly with support, operational, and revenue workflows
- Real catalog writes for Billing Draft execution when `BILLING_DRAFT_APPLY_MODE=true`

## OpenAI integration

OpenAI is used only for:
- diagnosis wording
- recommendation explanation
- rollout narrative
- executive memo generation

Guardrails:
- all metrics, scores, rankings, revenue impact, and billing draft objects are deterministic
- the model is instructed not to invent or override metrics
- structured JSON output is validated with Zod
- invalid output is retried once
- deterministic fallback copy is returned if OpenAI fails

## Revenue Impact computation

Revenue Impact is deterministic and code-driven:
- actual revenue is sourced from Chargebee invoices when present
- missing historical periods are backfilled from recurring subscription revenue
- usage is normalized into:
  - Support Deflection
  - Operational Actions
  - Revenue Actions
- the hybrid model replays the same demand under included credits plus weighted overages
- windows supported:
  - `3m`
  - `6m`
  - `12m`

The replay is intentionally honest: if the source site lacks direct AI meters, the app labels the result as adapter-backed or inferred rather than pretending the usage is native.

## Billing Draft dry run

The Billing Draft tab is safe by default.

Flow:
1. Open `Review Plan Updates`
2. Choose which normalized plan tiers to include
3. Optionally exclude `enterprise`
4. Preview the payload
5. Confirm execution

Default behavior:
- returns a successful dry-run response
- does not mutate Chargebee
- clearly labels the operation as simulated

If `BILLING_DRAFT_APPLY_MODE=true` and `BILLING_DRAFT_DRY_RUN=false`, the app can apply limited item price updates server-side.

## API routes

- `GET /api/account/[id]`
- `GET /api/usage/[id]`
- `GET /api/revenue-impact/[id]?window=3m|6m|12m`
- `POST /api/analyze`
- `POST /api/exec-memo`
- `GET /api/billing-draft/[id]`
- `POST /api/billing-draft/preview`
- `POST /api/billing-draft/execute`

All routes validate inputs, return normalized objects, and hide provider internals.

## Local development

Useful commands:

```bash
npm run dev
npm run build
```

If you do not have Chargebee data shaped for the Gorgias thesis:
- keep `SAMPLE_MODE=false` to test the live adapter-backed path
- use `SAMPLE_MODE=true` when you want the original fixture-backed workspace for UI development

## Deployment notes

- This app is intended for server-side deployment where Chargebee and OpenAI secrets can be stored safely.
- Vercel works well for the App Router structure used here.
- The Chargebee API key must stay server-side.
- Dry-run billing mode should remain enabled for public demos and public repos.

## Security notes

- Chargebee and OpenAI credentials are never sent to the client.
- Server logs are structured and omit secrets.
- Billing writes are opt-in and disabled by default.
- The app returns product-style error messages rather than raw provider payloads.

## Limitations

- Adapter-backed usage inference is a fallback, not a substitute for native AI event metering.
- The Billing Draft apply flow intentionally supports only limited safe update behavior.
- Direct Gorgias account mapping depends on the connected Chargebee tenant.
- Narrative quality depends on OpenAI availability, though core analysis does not.

## Future improvements

- Add explicit customer-to-workspace mapping configuration
- Support richer Chargebee catalog writes for item families, items, and meters
- Replace heuristic bucket mapping with first-class AI event ingestion
- Add audit history for billing draft previews and executions
- Expand multi-account workspace selection beyond the single Gorgias submission flow
