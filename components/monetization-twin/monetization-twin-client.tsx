"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { AIRationaleDrawer } from "@/components/monetization-twin/ai-rationale-drawer";
import { BillingDraftPanel } from "@/components/monetization-twin/billing-draft-panel";
import { DiagnosisPanel } from "@/components/monetization-twin/diagnosis-panel";
import { EmptyTabState } from "@/components/monetization-twin/empty-tab-state";
import { ExecMemoPanel } from "@/components/monetization-twin/exec-memo-panel";
import { OverviewPanel } from "@/components/monetization-twin/overview-panel";
import { RecommendedModelPanel } from "@/components/monetization-twin/recommended-model-panel";
import { RevenueImpactPanel } from "@/components/monetization-twin/revenue-impact-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  BillingDraft,
  BillingDraftExecutionResult,
  BillingDraftPreview,
  ExecMemo,
  MonetizationAnalysisResult,
  NarrativeBundle,
  RevenueImpactSummary,
  RevenueWindow
} from "@/types/monetization";

type TabKey = "overview" | "diagnosis" | "recommended" | "impact" | "exec" | "billing";

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      "Content-Type": "application/json"
    },
    ...init
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? (payload as { error?: { message?: string } }).error?.message
        : `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

function LoadingPanel({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-dashed bg-white/95">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          {title}
        </div>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-[220px] w-full rounded-2xl" />
      </CardContent>
    </Card>
  );
}

export function MonetizationTwinClient({ accountId }: { accountId: "gorgias" }) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [analysis, setAnalysis] = useState<MonetizationAnalysisResult | null>(null);
  const [impactWindow, setImpactWindow] = useState<RevenueWindow>("6m");
  const [revenueImpact, setRevenueImpact] = useState<RevenueImpactSummary | null>(null);
  const [narrative, setNarrative] = useState<NarrativeBundle | null>(null);
  const [billingDraft, setBillingDraft] = useState<BillingDraft | null>(null);
  const [billingPreview, setBillingPreview] = useState<BillingDraftPreview | null>(null);
  const [billingExecution, setBillingExecution] = useState<BillingDraftExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImpactLoading, setIsImpactLoading] = useState(false);
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [isBillingExecuting, setIsBillingExecuting] = useState(false);

  async function loadAnalysis() {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await fetchJson<MonetizationAnalysisResult>("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ accountId })
      });
      setAnalysis(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to run analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function loadNarrative() {
    try {
      const result = await fetchJson<NarrativeBundle>("/api/exec-memo", {
        method: "POST",
        body: JSON.stringify({ accountId, tone: "executive" })
      });
      setNarrative(result);
    } catch {
      setNarrative(null);
    }
  }

  async function loadRevenueImpact(window: RevenueWindow) {
    setIsImpactLoading(true);

    try {
      const result = await fetchJson<RevenueImpactSummary>(`/api/revenue-impact/${accountId}?window=${window}`);
      setRevenueImpact(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load revenue impact.");
    } finally {
      setIsImpactLoading(false);
    }
  }

  async function loadBillingDraft() {
    setIsBillingLoading(true);

    try {
      const result = await fetchJson<BillingDraft>(`/api/billing-draft/${accountId}`);
      setBillingDraft(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load billing draft.");
    } finally {
      setIsBillingLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalysis();
  }, []);

  useEffect(() => {
    if (!analysis) {
      return;
    }

    void loadNarrative();
    void loadRevenueImpact(impactWindow);
    void loadBillingDraft();
  }, [analysis]);

  const execMemo: ExecMemo | null = narrative?.execMemo ?? null;

  const aiDrawerConfig = useMemo(() => {
    if (!analysis) {
      return null;
    }

    if (activeTab === "diagnosis") {
      return {
        title: "Diagnosis rationale",
        description:
          "Narrative copy is generated separately, but the diagnosis inputs remain deterministic and derived from Chargebee or adapter-backed normalized data.",
        summary: narrative?.diagnosisSummary,
        bullets: analysis.diagnosis.rationale
      };
    }

    if (activeTab === "recommended") {
      return {
        title: "Recommendation rationale",
        description:
          "Scenario ranking is deterministic. The narrative layer can explain the result, but it does not alter the winner or revenue model.",
        summary: narrative?.recommendationExplanation,
        bullets: analysis.recommendation.winner.rationale
      };
    }

    return null;
  }, [activeTab, analysis, narrative]);

  async function handlePreviewBilling(segments: Array<"starter" | "growth" | "enterprise">) {
    setIsBillingLoading(true);
    setBillingExecution(null);

    try {
      const preview = await fetchJson<BillingDraftPreview>("/api/billing-draft/preview", {
        method: "POST",
        body: JSON.stringify({ accountId, includedSegments: segments })
      });
      setBillingPreview(preview);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Unable to preview billing draft.");
    } finally {
      setIsBillingLoading(false);
    }
  }

  async function handleExecuteBilling(segments: Array<"starter" | "growth" | "enterprise">) {
    setIsBillingExecuting(true);

    try {
      const execution = await fetchJson<BillingDraftExecutionResult>("/api/billing-draft/execute", {
        method: "POST",
        body: JSON.stringify({ accountId, includedSegments: segments })
      });
      setBillingExecution(execution);
    } catch (executeError) {
      setError(executeError instanceof Error ? executeError.message : "Unable to execute billing draft.");
    } finally {
      setIsBillingExecuting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="print-hidden sticky top-0 z-20 border-b border-slate-200 bg-background/95 panel-blur">
        <div className="mx-auto max-w-[1440px] px-6 py-4 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                <span>Monetization Twin</span>
                <ChevronRight className="h-3.5 w-3.5" />
                <span>Gorgias</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-[28px] font-semibold tracking-tight text-slate-950">Gorgias</h1>
                <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                  Internal concept
                </Badge>
                {analysis ? (
                  <Badge variant="success">Recommended: {analysis.recommendation.winner.name}</Badge>
                ) : null}
                {analysis ? (
                  <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                    {analysis.metadata.sourceMode === "chargebee" ? "Chargebee-backed" : analysis.metadata.sourceMode === "sample" ? "Sample mode" : "Adapter-backed"}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                Integration-backed monetization analysis for Gorgias using live Chargebee reads, deterministic replay logic, and narrative-only Responses API output.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {aiDrawerConfig ? <AIRationaleDrawer {...aiDrawerConfig} /> : null}
              <Button variant="outline" onClick={() => void loadAnalysis()} disabled={isAnalyzing}>
                <RefreshCw className={isAnalyzing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                {isAnalyzing ? "Refreshing" : "Refresh analysis"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-6 py-6 lg:px-8">
        {error ? (
          <Card className="mb-5 border-rose-200 bg-rose-50">
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-semibold text-rose-700">Unable to complete the current request</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{error}</p>
              </div>
              <Button variant="outline" onClick={() => void loadAnalysis()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!analysis && isAnalyzing ? (
          <LoadingPanel
            title="Running monetization analysis"
            description="Loading Chargebee catalog, customer, usage, and invoice data to build the normalized Gorgias workspace."
          />
        ) : null}

        {!analysis && !isAnalyzing ? (
          <EmptyTabState
            title="Analysis not available"
            description="Monetization Twin could not build the workspace. Check your Chargebee configuration or enable SAMPLE_MODE for local development."
          />
        ) : null}

        {analysis ? (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)} className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList className="w-full justify-start overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 md:w-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
                <TabsTrigger value="recommended">Recommended Model</TabsTrigger>
                <TabsTrigger value="impact">Revenue Impact</TabsTrigger>
                <TabsTrigger value="exec">Exec Memo</TabsTrigger>
                <TabsTrigger value="billing">Billing Draft</TabsTrigger>
              </TabsList>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                  Generated {new Date(analysis.metadata.generatedAt).toLocaleString()}
                </Badge>
                <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                  Billing {analysis.metadata.dryRunBilling ? "Dry run" : "Apply enabled"}
                </Badge>
              </div>
            </div>

            <TabsContent value="overview" className="mt-0">
              <OverviewPanel analysis={analysis} isRefreshing={isAnalyzing} onRefresh={() => void loadAnalysis()} />
            </TabsContent>

            <TabsContent value="diagnosis" className="mt-0">
              <DiagnosisPanel analysis={analysis} narrative={narrative ?? undefined} />
            </TabsContent>

            <TabsContent value="recommended" className="mt-0">
              <RecommendedModelPanel analysis={analysis} narrative={narrative ?? undefined} />
            </TabsContent>

            <TabsContent value="impact" className="mt-0">
              {revenueImpact ? (
                <RevenueImpactPanel
                  impact={revenueImpact}
                  window={impactWindow}
                  isLoading={isImpactLoading}
                  onWindowChange={(window) => {
                    setImpactWindow(window);
                    void loadRevenueImpact(window);
                  }}
                />
              ) : (
                <LoadingPanel title="Loading revenue impact" description="Replaying historical revenue under the hybrid model." />
              )}
            </TabsContent>

            <TabsContent value="exec" className="mt-0">
              {execMemo ? (
                <ExecMemoPanel memo={execMemo} />
              ) : (
                <LoadingPanel title="Preparing exec memo" description="Generating narrative framing without changing metrics or recommendation ranking." />
              )}
            </TabsContent>

            <TabsContent value="billing" className="mt-0">
              {billingDraft ? (
                <BillingDraftPanel
                  billingDraft={billingDraft}
                  preview={billingPreview}
                  executionResult={billingExecution}
                  previewLoading={isBillingLoading}
                  executeLoading={isBillingExecuting}
                  onPreview={handlePreviewBilling}
                  onExecute={handleExecuteBilling}
                />
              ) : (
                <LoadingPanel title="Loading billing draft" description="Normalizing Chargebee catalog updates into a safe dry-run preview." />
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    </div>
  );
}
