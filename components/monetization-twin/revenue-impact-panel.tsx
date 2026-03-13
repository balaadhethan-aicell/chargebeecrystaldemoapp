"use client";

import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactNumber, formatCurrency } from "@/lib/format";
import type { RevenueImpactSummary, RevenueWindow } from "@/types/monetization";

const WINDOWS: RevenueWindow[] = ["3m", "6m", "12m"];

export function RevenueImpactPanel({
  impact,
  window,
  isLoading,
  onWindowChange
}: {
  impact: RevenueImpactSummary;
  window: RevenueWindow;
  isLoading: boolean;
  onWindowChange: (nextWindow: RevenueWindow) => void;
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardDescription>Revenue Impact</CardDescription>
              <CardTitle className="mt-2 text-[24px]">Historical replay under the recommended model</CardTitle>
            </div>
            <div className="flex gap-2">
              {WINDOWS.map((entry) => (
                <Button
                  key={entry}
                  variant={window === entry ? "default" : "outline"}
                  size="sm"
                  onClick={() => onWindowChange(entry)}
                  disabled={isLoading}
                >
                  {entry === "3m" ? "Last 3 months" : entry === "6m" ? "Last 6 months" : "Last 1 year"}
                </Button>
              ))}
            </div>
          </div>
          <p className="text-sm leading-7 text-slate-600">{impact.methodology}</p>
        </CardHeader>
        <CardContent className="grid gap-3 pt-5 lg:grid-cols-4">
          {impact.cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="surface-label">{card.label}</p>
              <p className="mt-2 text-[20px] font-semibold text-slate-950">{card.value}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="bg-white/95">
          <CardHeader>
            <CardDescription>Monthly trend</CardDescription>
            <CardTitle>Actual vs simulated revenue</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={impact.series}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tickFormatter={(value) => formatCompactNumber(value)} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [formatCurrency(value, 0, impact.currencyCode), "Revenue"]} />
                <Legend />
                <Line type="monotone" dataKey="actualRevenue" name="Actual" stroke="#94a3b8" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="simulatedRevenue" name="Hybrid" stroke="#2563eb" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/95">
          <CardHeader>
            <CardDescription>Monthly lift</CardDescription>
            <CardTitle>Incremental revenue created by value weighting</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={impact.series}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tickFormatter={(value) => formatCompactNumber(value)} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [formatCurrency(value, 0, impact.currencyCode), "Lift"]} />
                <Bar dataKey="incrementalLift" fill="#0f172a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/95">
        <CardHeader>
          <CardDescription>Value-bucket contribution</CardDescription>
          <CardTitle>Where the hybrid model captures incremental value</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={impact.valueBucketContribution}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="bucket" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis tickFormatter={(value) => formatCompactNumber(value)} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip formatter={(value: number) => [formatCurrency(value, 0, impact.currencyCode), "Revenue"]} />
              <Legend />
              <Bar dataKey="actual" name="Current" fill="#cbd5e1" radius={[8, 8, 0, 0]} />
              <Bar dataKey="simulated" name="Hybrid" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        {impact.notes.map((note) => (
          <div key={note} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-700">
            {note}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
