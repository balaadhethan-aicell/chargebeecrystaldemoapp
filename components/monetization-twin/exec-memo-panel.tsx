"use client";

import { motion } from "framer-motion";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExecMemo } from "@/types/monetization";

export function ExecMemoPanel({ memo }: { memo: ExecMemo }) {
  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="print-hidden flex justify-end">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print / Export
        </Button>
      </div>

      <Card className="print-reset bg-white">
        <CardHeader className="border-b border-slate-200 pb-6">
          <CardDescription>Executive memo</CardDescription>
          <CardTitle className="text-[28px]">{memo.title}</CardTitle>
          <p className="text-sm leading-7 text-slate-600">
            Prepared from live integration inputs with deterministic business logic and narrative-only LLM output.
          </p>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Current issue</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">{memo.currentIssue}</p>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Recommendation</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">{memo.recommendation}</p>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Expected upside</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">{memo.expectedUpside}</p>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Rollout plan</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">{memo.rolloutPlan}</p>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Risks</h2>
            <div className="mt-3 space-y-3">
              {memo.risks.map((risk) => (
                <div key={risk} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm leading-7 text-slate-700">{risk}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Methodology note</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">{memo.methodologyNote}</p>
          </section>
        </CardContent>
      </Card>
    </motion.div>
  );
}
