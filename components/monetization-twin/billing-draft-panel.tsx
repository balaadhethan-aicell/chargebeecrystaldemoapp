"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, FileCog, Rocket, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCompactNumber, formatCurrency } from "@/lib/format";
import type {
  BillingDraft,
  BillingDraftExecutionResult,
  BillingDraftPreview
} from "@/types/monetization";

const SEGMENTS = ["starter", "growth", "enterprise"] as const;

function toCatalogId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function BillingDraftPanel({
  billingDraft,
  preview,
  executionResult,
  previewLoading,
  executeLoading,
  onPreview,
  onExecute
}: {
  billingDraft: BillingDraft;
  preview: BillingDraftPreview | null;
  executionResult: BillingDraftExecutionResult | null;
  previewLoading: boolean;
  executeLoading: boolean;
  onPreview: (segments: Array<"starter" | "growth" | "enterprise">) => void;
  onExecute: (segments: Array<"starter" | "growth" | "enterprise">) => void;
}) {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedSegments, setSelectedSegments] = useState<Array<"starter" | "growth" | "enterprise">>([
    "starter",
    "growth",
    "enterprise"
  ]);

  const currentPreview = useMemo(() => preview, [preview]);

  function toggleSegment(segment: "starter" | "growth" | "enterprise") {
    setSelectedSegments((current) =>
      current.includes(segment) ? current.filter((entry) => entry !== segment) : [...current, segment]
    );
  }

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Card className="bg-white/95">
        <CardHeader className="border-b border-slate-200 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardDescription>Billing Draft</CardDescription>
              <CardTitle className="mt-2 text-[24px]">Chargebee catalog update plan</CardTitle>
            </div>
            <Button
              onClick={() => {
                setIsReviewOpen(true);
                onPreview(selectedSegments);
              }}
            >
              <FileCog className="h-4 w-4" />
              Review Plan Updates
            </Button>
          </div>
          <p className="text-sm leading-7 text-slate-600">
            Draft objects are generated from live Chargebee catalog data and default to dry-run execution for public-repo safety.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 pt-5 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="surface-label">Item family</p>
            <p className="mt-2 text-[17px] font-semibold text-slate-950">{billingDraft.itemFamilyId}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="surface-label">Pricing model</p>
            <p className="mt-2 text-[17px] font-semibold text-slate-950">Included weighted credits</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="surface-label">Execution mode</p>
            <p className="mt-2 text-[17px] font-semibold text-slate-950">
              {currentPreview?.mode === "apply" ? "Apply enabled" : "Dry run"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="surface-label">Invoice explainability</p>
            <p className="mt-2 text-[17px] font-semibold text-slate-950">
              {billingDraft.meters.length} meters across 3 value classes
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="bg-white/95">
          <CardHeader>
            <CardDescription>Plans</CardDescription>
            <CardTitle>Proposed plan updates</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Proposed</TableHead>
                  <TableHead>Included credits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingDraft.plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-semibold text-slate-950">
                      <div>{plan.planName}</div>
                      <code className="mt-1 block text-xs text-slate-500">{plan.currentItemPriceId ?? toCatalogId(plan.planName)}</code>
                    </TableCell>
                    <TableCell>{formatCurrency(plan.currentPrice, 0, billingDraft.currencyCode)}</TableCell>
                    <TableCell>{formatCurrency(plan.proposedPrice, 0, billingDraft.currencyCode)}</TableCell>
                    <TableCell>{formatCompactNumber(plan.includedCredits)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-white/95">
          <CardHeader>
            <CardDescription>Meters and value classes</CardDescription>
            <CardTitle>Rating model</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meter</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Rating logic</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingDraft.meters.map((meter) => (
                  <TableRow key={meter.id}>
                    <TableCell className="font-semibold text-slate-950">
                      <div>{meter.name}</div>
                      <code className="mt-1 block text-xs text-slate-500">{meter.id}</code>
                    </TableCell>
                    <TableCell>{meter.unit}</TableCell>
                    <TableCell className="text-slate-600">{meter.ratingLogic}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="bg-white/95">
          <CardHeader>
            <CardDescription>Weighted credit classes</CardDescription>
            <CardTitle>Usage class mapping</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bucket</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Examples</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingDraft.weightedCreditClasses.map((item) => (
                  <TableRow key={item.bucket}>
                    <TableCell className="font-semibold text-slate-950">{item.bucket}</TableCell>
                    <TableCell>{item.weight}</TableCell>
                    <TableCell className="text-slate-600">{item.examples}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-white/95">
          <CardHeader>
            <CardDescription>Overage and packaging rules</CardDescription>
            <CardTitle>Operational controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {billingDraft.overageRules.map((rule) => (
              <div key={rule.rule} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="surface-label">{rule.rule}</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{rule.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {billingDraft.notes.map((note) => (
          <div key={note} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-700">
            {note}
          </div>
        ))}
      </div>

      <Sheet open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <SheetContent className="max-w-2xl">
          <SheetHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <SheetTitle className="pt-3">Review Plan Updates</SheetTitle>
            <SheetDescription className="leading-6">
              Preview the exact draft scope before running a dry run or live apply. Enterprise can be excluded from execution without changing the recommendation logic.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="surface-label">Included plan scope</p>
              <div className="mt-4 space-y-3">
                {SEGMENTS.map((segment) => (
                  <label key={segment} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      checked={selectedSegments.includes(segment)}
                      onChange={() => toggleSegment(segment)}
                    />
                    <span className="font-medium capitalize">{segment}</span>
                  </label>
                ))}
              </div>

              <Button
                variant="outline"
                className="mt-4"
                onClick={() => onPreview(selectedSegments)}
                disabled={previewLoading || selectedSegments.length === 0}
              >
                <Rocket className="h-4 w-4" />
                {previewLoading ? "Refreshing preview" : "Refresh preview"}
              </Button>
            </div>

            {currentPreview ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="surface-label">Execution summary</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{currentPreview.summary}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="surface-label">Payload preview</p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">
                        {currentPreview.planCount} plan updates · {currentPreview.payloadPreview.meterIds.length} meters
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-950">
                      {currentPreview.mode === "apply" ? "Apply enabled" : "Dry run"}
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {currentPreview.payloadPreview.planUpdates.map((plan) => (
                      <div key={`${plan.segment}-${plan.itemPriceId ?? "new"}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                        <span className="font-semibold capitalize text-slate-950">{plan.segment}</span>{" "}
                        · {plan.itemPriceId ?? "new item price"} · {formatCurrency(plan.proposedPrice, 0, billingDraft.currencyCode)} · {formatCompactNumber(plan.includedCredits)} credits
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {currentPreview.notes.map((note) => (
                    <div key={note} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">
                      {note}
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  onClick={() => onExecute(selectedSegments)}
                  disabled={executeLoading || selectedSegments.length === 0}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {executeLoading ? "Executing draft" : "Confirm"}
                </Button>
              </div>
            ) : null}

            {executionResult ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="surface-label text-emerald-700">Execution result</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{executionResult.message}</p>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
