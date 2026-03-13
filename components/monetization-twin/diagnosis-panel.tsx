"use client";

import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCompactNumber, formatCurrency, formatPercent } from "@/lib/format";
import type { MonetizationAnalysisResult, NarrativeBundle } from "@/types/monetization";

export function DiagnosisPanel({
  analysis,
  narrative
}: {
  analysis: MonetizationAnalysisResult;
  narrative?: NarrativeBundle;
}) {
  const revenue = analysis.usage.buckets.find((bucket) => bucket.bucketId === "revenue_actions");
  const support = analysis.usage.buckets.find((bucket) => bucket.bucketId === "support_deflection");
  const operational = analysis.usage.buckets.find((bucket) => bucket.bucketId === "operational_actions");

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
              Diagnosis
            </Badge>
            <Badge variant="secondary">
              {analysis.usage.method === "metered_usage" ? "Usage records" : "Adapter-backed usage"}
            </Badge>
          </div>
          <CardTitle className="max-w-5xl text-[24px] leading-tight">
            {analysis.diagnosis.headline}
          </CardTitle>
          <CardDescription className="max-w-4xl text-sm leading-7">
            {narrative?.diagnosisSummary ?? analysis.diagnosis.summary}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="surface-label">Support volume share</p>
              <p className="mt-2 text-[22px] font-semibold text-slate-950">
                {formatPercent(support?.usageSharePct ?? 0, 1)}
              </p>
              <p className="mt-1 text-sm text-slate-600">Dominant demand bucket under the current billing shape.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="surface-label">Revenue value share</p>
              <p className="mt-2 text-[22px] font-semibold text-slate-950">
                {formatPercent(revenue?.modeledValueSharePct ?? 0, 1)}
              </p>
              <p className="mt-1 text-sm text-slate-600">Modeled customer value tied to revenue-driving AI intent.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="surface-label">Operational weighted demand</p>
              <p className="mt-2 text-[22px] font-semibold text-slate-950">
                {formatCompactNumber(operational?.weightedCredits ?? 0)}
              </p>
              <p className="mt-1 text-sm text-slate-600">Credit-weighted operational demand in the current replay.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
            <p className="text-sm font-semibold text-slate-950">{analysis.diagnosis.callout}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {analysis.diagnosis.signals.map((signal, index) => (
          <Card key={signal.title} className="bg-white/95">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="surface-label">Signal {String(index + 1).padStart(2, "0")}</p>
                  <CardTitle className="mt-2 text-[17px]">{signal.title}</CardTitle>
                </div>
                <Badge
                  variant={
                    signal.severity === "warning"
                      ? "warning"
                      : signal.severity === "opportunity"
                        ? "success"
                        : "outline"
                  }
                >
                  {signal.severity === "warning" ? "Gap" : signal.severity === "opportunity" ? "Fit" : "Signal"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-slate-600">{signal.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="bg-white/95">
          <CardHeader>
            <CardDescription>Usage by value bucket</CardDescription>
            <CardTitle>Support volume still drives the usage picture</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.diagnosis.usageByBucket}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tickFormatter={(value) => formatCompactNumber(value)} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [formatCompactNumber(value), "Inferred actions"]} />
                <Bar dataKey="usage" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/95">
          <CardHeader>
            <CardDescription>Billed value by bucket</CardDescription>
            <CardTitle>Current pricing follows billing shape, not value density</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.diagnosis.billedValueByBucket}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tickFormatter={(value) => formatCompactNumber(value)} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [formatCurrency(value, 0, analysis.account.currencyCode), "Billed value"]} />
                <Bar dataKey="billedValue" fill="#0f172a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/95">
        <CardHeader>
          <CardDescription>Value surfaces</CardDescription>
          <CardTitle>Customers feel value in distinct operational contexts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bucket</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Monetization gap</TableHead>
                <TableHead>Recommended pricing shape</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.diagnosis.valueSurfaces.map((row) => (
                <TableRow key={row.bucket}>
                  <TableCell className="font-semibold text-slate-950">{row.bucket}</TableCell>
                  <TableCell>{row.buyer}</TableCell>
                  <TableCell className="max-w-[260px] text-slate-600">{row.outcome}</TableCell>
                  <TableCell className="max-w-[300px] text-slate-600">{row.monetizationGap}</TableCell>
                  <TableCell className="max-w-[260px] text-slate-600">{row.pricingShape}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
