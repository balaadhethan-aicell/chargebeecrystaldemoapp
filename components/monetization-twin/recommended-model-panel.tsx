"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { MonetizationAnalysisResult, NarrativeBundle } from "@/types/monetization";

function scoreTone(score: number, inverse = false) {
  const adjusted = inverse ? 100 - score : score;
  if (adjusted >= 75) return "text-emerald-600";
  if (adjusted >= 55) return "text-amber-600";
  return "text-rose-600";
}

export function RecommendedModelPanel({
  analysis,
  narrative
}: {
  analysis: MonetizationAnalysisResult;
  narrative?: NarrativeBundle;
}) {
  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Card className="bg-white/95">
        <CardHeader className="border-b border-slate-200 pb-5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
              Recommended Model
            </Badge>
            <Badge variant="success">{analysis.recommendation.winner.name}</Badge>
          </div>
          <CardTitle className="text-[24px]">Scenario comparison and recommended pricing model</CardTitle>
          <CardDescription className="max-w-4xl text-sm leading-7">
            {narrative?.recommendationExplanation ?? analysis.recommendation.methodology}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 pt-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="surface-label">Recommended scenario</p>
            <p className="mt-2 text-[18px] font-semibold text-slate-950">
              {analysis.recommendation.winner.name}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="surface-label">Revenue index</p>
            <p className="mt-2 text-[18px] font-semibold text-slate-950">
              {analysis.recommendation.winner.revenueIndex}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="surface-label">Predictability / churn</p>
            <p className="mt-2 text-[18px] font-semibold text-slate-950">
              {analysis.recommendation.winner.predictabilityScore} / {analysis.recommendation.winner.churnRiskLabel}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr_0.95fr]">
        {analysis.recommendation.scenarios.map((scenario, index) => (
          <Card
            key={scenario.id}
            className={
              scenario.isRecommended
                ? "border-blue-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_36px_-28px_rgba(37,99,235,0.35)]"
                : "bg-slate-50/70"
            }
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={scenario.isRecommended ? "default" : "outline"}>
                      {scenario.isRecommended ? "Recommended" : `Option ${index + 1}`}
                    </Badge>
                    {scenario.isRecommended ? <Trophy className="h-4 w-4 text-blue-600" /> : null}
                  </div>
                  <CardTitle className="mt-3 text-[20px]">{scenario.name}</CardTitle>
                  <CardDescription className="mt-2 text-sm leading-7">{scenario.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="surface-label">Revenue index</p>
                  <p className="mt-2 text-[22px] font-semibold text-slate-950">{scenario.revenueIndex}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="surface-label">Predictability</p>
                  <p className={`mt-2 text-[22px] font-semibold ${scoreTone(scenario.predictabilityScore)}`}>
                    {scenario.predictabilityScore}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="surface-label">Churn risk</p>
                  <p className={`mt-2 text-[18px] font-semibold ${scoreTone(scenario.churnRiskScore, true)}`}>
                    {scenario.churnRiskLabel}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="surface-label">Implementation</p>
                  <p className={`mt-2 text-[18px] font-semibold ${scoreTone(scenario.implementationComplexityScore, true)}`}>
                    {scenario.implementationComplexityLabel}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="surface-label">Fit segment</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{scenario.fitSegment}</p>
                  </div>
                  <div className="text-right">
                    <p className="surface-label">Estimated monthly revenue</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {formatCurrency(scenario.estimatedMonthlyRevenue, 0, analysis.account.currencyCode)}
                    </p>
                  </div>
                </div>
              </div>

              {scenario.isRecommended ? (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="surface-label text-blue-700">Why this wins</p>
                  <div className="mt-3 space-y-2">
                    {scenario.rationale.map((reason) => (
                      <div key={reason} className="flex gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                        <p className="text-sm leading-6 text-slate-700">{reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <p className="mb-3 surface-label">Pros</p>
                <div className="space-y-2">
                  {scenario.pros.map((pro) => (
                    <div key={pro} className="flex gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <p className="text-sm leading-6 text-slate-700">{pro}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 surface-label">Cons</p>
                <div className="space-y-2">
                  {scenario.cons.map((con) => (
                    <div key={con} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-sm leading-6 text-slate-700">{con}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white/95">
        <CardHeader>
          <CardDescription>Rollout highlights</CardDescription>
          <CardTitle>Delivery posture for the recommended model</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          {analysis.recommendation.rolloutHighlights.map((highlight) => (
            <div key={highlight} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
              {highlight}
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
