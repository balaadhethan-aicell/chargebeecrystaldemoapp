"use client";

import { BrainCircuit, Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AIRationaleDrawerProps {
  title: string;
  description: string;
  summary?: string;
  bullets: string[];
}

export function AIRationaleDrawer({
  title,
  description,
  summary,
  bullets
}: AIRationaleDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 bg-white">
          <Sparkles className="h-4 w-4 text-blue-600" />
          AI Rationale
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50">
              <BrainCircuit className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                Narrative Layer
              </Badge>
            </div>
          </div>
          <SheetTitle className="pt-3">{title}</SheetTitle>
          <SheetDescription className="leading-6">{description}</SheetDescription>
        </SheetHeader>

        {summary ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Summary
            </p>
            <p className="text-sm leading-7 text-slate-700">{summary}</p>
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Decision inputs
          </p>
          {bullets.map((bullet) => (
            <div
              key={bullet}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700"
            >
              {bullet}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
