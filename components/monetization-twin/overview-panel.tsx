"use client";

import { motion } from "framer-motion";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactNumber, formatCurrency, formatPercent } from "@/lib/format";
import type { MonetizationAnalysisResult } from "@/types/monetization";

export function OverviewPanel({
  analysis,
  isRefreshing,
  onRefresh
}: {
  analysis: MonetizationAnalysisResult;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  const { account } = analysis;

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-white/95">
          <CardHeader className="border-b border-slate-200 pb-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                Overview
              </Badge>
              <Badge variant="secondary">
                {analysis.metadata.sourceMode === "chargebee" ? "Chargebee-backed" : analysis.metadata.sourceMode === "sample" ? "Sample mode" : "Adapter-backed"}
              </Badge>
            </div>
            <CardTitle className="text-[24px]">Gorgias monetization workspace</CardTitle>
            <CardDescription className="max-w-4xl text-sm leading-7">
              {account.summary}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 pt-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div>
                <p className="surface-label">Commercial foundation</p>
                <p className="mt-2 text-[18px] font-semibold text-slate-950">{account.foundation}</p>
              </div>
              <div>
                <p className="surface-label">Current monetization model</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{account.currentMonetizationModel}</p>
              </div>
              <div className="grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
                <div>
                  <p className="surface-label">AI revenue contribution</p>
                  <p className="mt-2 text-[20px] font-semibold text-slate-950">
                    {formatPercent(account.aiRevenueContributionPct, 1)}
                  </p>
                </div>
                <div>
                  <p className="surface-label">AI attach rate</p>
                  <p className="mt-2 text-[20px] font-semibold text-slate-950">
                    {formatPercent(account.aiAttachRatePct, 1)}
                  </p>
                </div>
                <div>
                  <p className="surface-label">Expansion trend</p>
                  <p className="mt-2 text-[20px] font-semibold text-slate-950">
                    +{formatPercent(account.expansionTrendPct, 1)}
                  </p>
                </div>
                <div>
                  <p className="surface-label">Annualized revenue base</p>
                  <p className="mt-2 text-[20px] font-semibold text-slate-950">
                    {formatCurrency(account.arr, 0, account.currencyCode)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="surface-label">Primary objective</p>
                <p className="mt-3 text-sm leading-7 text-slate-700">{account.primaryGoal}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="surface-label">Workspace status</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {analysis.recommendation.winner.name}
                    </p>
                  </div>
                  <Button variant="outline" onClick={onRefresh} disabled={isRefreshing}>
                    {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    {isRefreshing ? "Refreshing" : "Refresh analysis"}
                  </Button>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Scenario ranking is deterministic. Narrative copy can change, but metrics and recommendation ordering do not.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="surface-label">Data notes</p>
                <div className="mt-3 space-y-2">
                  {account.notes.map((note) => (
                    <div key={note} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-700">
                      {note}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95">
          <CardHeader>
            <CardDescription>Plan normalization</CardDescription>
            <CardTitle className="text-[22px]">Tier mix and AI penetration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {account.planMix.map((plan) => (
              <div key={plan.planId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{plan.planName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {plan.normalizedSegment} tier · {formatCompactNumber(plan.activeSubscriptions)} subs
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-950">
                      {formatPercent(plan.aiAttachRatePct, 1)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">AI attach</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="surface-label">Recurring revenue</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {formatCurrency(plan.monthlyRecurringRevenue, 0, account.currencyCode)}
                    </p>
                  </div>
                  <div>
                    <p className="surface-label">Included credits (draft)</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {formatCompactNumber(plan.includedCredits)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {account.stats.map((stat) => (
          <Card key={stat.label} className="bg-white/95">
            <CardHeader className="pb-1">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-[22px]">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[13px] leading-6 text-slate-600">{stat.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
