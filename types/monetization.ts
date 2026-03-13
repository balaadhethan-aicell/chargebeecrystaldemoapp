import { z } from "zod";

export const accountIdSchema = z.enum(["gorgias"]);
export type AccountId = z.infer<typeof accountIdSchema>;

export const revenueWindowSchema = z.enum(["3m", "6m", "12m"]);
export type RevenueWindow = z.infer<typeof revenueWindowSchema>;

export const valueBucketIdSchema = z.enum([
  "support_deflection",
  "operational_actions",
  "revenue_actions"
]);
export type ValueBucketId = z.infer<typeof valueBucketIdSchema>;

export const executionModeSchema = z.enum(["dry_run", "apply"]);
export type ExecutionMode = z.infer<typeof executionModeSchema>;

export type DataSourceMode = "chargebee" | "adapter_inferred" | "sample";

export interface StatCard {
  label: string;
  value: string;
  detail: string;
}

export interface PlanMixEntry {
  planId: string;
  planName: string;
  normalizedSegment: "starter" | "growth" | "enterprise";
  activeSubscriptions: number;
  aiAttachRatePct: number;
  monthlyRecurringRevenue: number;
  includedCredits: number;
}

export interface AccountSummary {
  id: AccountId;
  displayName: string;
  backingCustomerId?: string;
  backingCustomerName?: string;
  currencyCode: string;
  foundation: string;
  currentMonetizationModel: string;
  aiRevenueContributionPct: number;
  aiAttachRatePct: number;
  expansionTrendPct: number;
  arr: number;
  summary: string;
  primaryGoal: string;
  resolutionMode: DataSourceMode;
  planMix: PlanMixEntry[];
  stats: StatCard[];
  notes: string[];
}

export interface CatalogPlanSummary {
  itemPriceId: string;
  itemId: string;
  name: string;
  externalName: string;
  amount: number;
  currencyCode: string;
  periodUnit: string;
  itemType: "plan" | "addon" | "charge" | "unknown";
  familyId?: string;
  description?: string;
  normalizedSegment: "starter" | "growth" | "enterprise";
}

export interface CatalogSummary {
  currencyCode: string;
  plans: CatalogPlanSummary[];
  addOns: CatalogPlanSummary[];
  currentPricingModel: "flat" | "usage" | "hybrid";
  notes: string[];
}

export interface UsageBucketSummary {
  bucketId: ValueBucketId;
  label: string;
  inferredActions: number;
  weightedCredits: number;
  actualRevenue: number;
  simulatedRevenue: number;
  currentRevenueSharePct: number;
  modeledValueSharePct: number;
  usageSharePct: number;
  method: "metered_usage" | "invoice_inference" | "subscription_inference";
}

export interface UsageSeriesPoint {
  month: string;
  actualRevenue: number;
  baseRecurringRevenue: number;
  supportDeflection: number;
  operationalActions: number;
  revenueActions: number;
}

export interface UsageSummary {
  currencyCode: string;
  method: "metered_usage" | "invoice_inference" | "subscription_inference";
  hasUsageRecords: boolean;
  buckets: UsageBucketSummary[];
  monthlySeries: UsageSeriesPoint[];
  notes: string[];
}

export interface DiagnosisSignal {
  title: string;
  detail: string;
  severity: "neutral" | "opportunity" | "warning";
}

export interface ValueSurfaceRow {
  bucket: string;
  buyer: string;
  outcome: string;
  monetizationGap: string;
  pricingShape: string;
}

export interface DiagnosisSummary {
  headline: string;
  summary: string;
  callout: string;
  signals: DiagnosisSignal[];
  valueSurfaces: ValueSurfaceRow[];
  usageByBucket: Array<{
    bucket: string;
    usage: number;
  }>;
  billedValueByBucket: Array<{
    bucket: string;
    billedValue: number;
  }>;
  rationale: string[];
}

export interface RecommendationScenario {
  id: "current_model" | "included_allowance" | "value_weighted_hybrid";
  name: string;
  description: string;
  revenueIndex: number;
  predictabilityScore: number;
  churnRiskScore: number;
  implementationComplexityScore: number;
  churnRiskLabel: string;
  implementationComplexityLabel: string;
  fitSegment: string;
  pros: string[];
  cons: string[];
  estimatedMonthlyRevenue: number;
  rationale: string[];
  isRecommended: boolean;
}

export interface RecommendationSummary {
  recommendedScenarioId: RecommendationScenario["id"];
  winner: RecommendationScenario;
  scenarios: RecommendationScenario[];
  rolloutHighlights: string[];
  methodology: string;
}

export interface RevenueImpactPoint {
  month: string;
  actualRevenue: number;
  simulatedRevenue: number;
  incrementalLift: number;
  liftPct: number;
}

export interface RevenueImpactBucketContribution {
  bucket: string;
  actual: number;
  simulated: number;
}

export interface RevenueImpactSummary {
  window: RevenueWindow;
  currencyCode: string;
  methodology: string;
  actualRevenue: number;
  simulatedRevenue: number;
  incrementalRevenueLift: number;
  liftPct: number;
  series: RevenueImpactPoint[];
  valueBucketContribution: RevenueImpactBucketContribution[];
  cards: StatCard[];
  notes: string[];
}

export interface BillingDraftPlan {
  id: string;
  planName: string;
  currentItemPriceId?: string;
  normalizedSegment: "starter" | "growth" | "enterprise";
  currentPrice: number;
  proposedPrice: number;
  includedCredits: number;
  targetSegment: string;
  updateSummary: string;
}

export interface BillingDraftMeter {
  id: string;
  name: string;
  unit: string;
  ratingLogic: string;
}

export interface BillingDraft {
  itemFamilyId: string;
  itemFamilyName: string;
  currencyCode: string;
  plans: BillingDraftPlan[];
  proposedAddOns: Array<{
    id: string;
    name: string;
    pricing: string;
    purpose: string;
  }>;
  meters: BillingDraftMeter[];
  weightedCreditClasses: Array<{
    bucket: string;
    weight: string;
    examples: string;
  }>;
  overageRules: Array<{
    rule: string;
    detail: string;
  }>;
  notes: string[];
}

export interface BillingDraftPreview {
  includedSegments: Array<"starter" | "growth" | "enterprise">;
  excludedSegments: Array<"starter" | "growth" | "enterprise">;
  planCount: number;
  mode: ExecutionMode;
  summary: string;
  payloadPreview: {
    itemFamilyId: string;
    planUpdates: Array<{
      segment: "starter" | "growth" | "enterprise";
      itemPriceId?: string;
      proposedPrice: number;
      includedCredits: number;
    }>;
    meterIds: string[];
  };
  notes: string[];
}

export interface BillingDraftExecutionResult {
  mode: ExecutionMode;
  success: boolean;
  dryRun: boolean;
  message: string;
  operations: Array<{
    type: "item" | "item_price" | "meter" | "plan_update";
    status: "simulated" | "applied" | "skipped";
    target: string;
  }>;
}

export interface ExecMemo {
  title: string;
  currentIssue: string;
  recommendation: string;
  expectedUpside: string;
  rolloutPlan: string;
  risks: string[];
  methodologyNote: string;
}

export interface NarrativeBundle {
  diagnosisSummary: string;
  recommendationExplanation: string;
  rolloutNarrative: string;
  execMemo: ExecMemo;
}

export interface AnalysisMetadata {
  sampleMode: boolean;
  sourceMode: DataSourceMode;
  generatedAt: string;
  dryRunBilling: boolean;
}

export interface MonetizationAnalysisResult {
  account: AccountSummary;
  catalog: CatalogSummary;
  usage: UsageSummary;
  diagnosis: DiagnosisSummary;
  recommendation: RecommendationSummary;
  metadata: AnalysisMetadata;
}

export const billingPreviewRequestSchema = z.object({
  accountId: accountIdSchema.default("gorgias"),
  includedSegments: z
    .array(z.enum(["starter", "growth", "enterprise"]))
    .min(1)
    .default(["starter", "growth", "enterprise"])
});

export const analyzeRequestSchema = z.object({
  accountId: accountIdSchema.default("gorgias")
});

export const execMemoRequestSchema = z.object({
  accountId: accountIdSchema.default("gorgias"),
  tone: z.enum(["executive", "finance", "product"]).default("executive")
});
