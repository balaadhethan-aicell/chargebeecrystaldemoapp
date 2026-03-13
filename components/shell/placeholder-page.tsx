import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderPageProps {
  breadcrumb: string;
  title: string;
  description: string;
  cards: Array<{
    title: string;
    description: string;
    value: string;
  }>;
}

export function PlaceholderPage({
  breadcrumb,
  title,
  description,
  cards
}: PlaceholderPageProps) {
  return (
    <div className="min-h-screen">
      <header className="print-hidden sticky top-0 z-20 border-b border-slate-200 bg-background/90 panel-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {breadcrumb}
            </p>
            <div className="mt-1 flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
              <Badge variant="outline">Product Surface</Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
          </div>

          <Button asChild variant="outline">
            <Link href="/monetization-twin/gorgias">
              Open Gorgias Twin
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-6 py-8 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.title} className="bg-white/95">
              <CardHeader>
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className="text-3xl">{card.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-600">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 bg-white/95">
          <CardHeader>
            <CardTitle>Why this page exists in the prototype</CardTitle>
            <CardDescription>
              Monetization Twin is the primary workflow, and the surrounding product shell keeps the experience grounded in a realistic Chargebee workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                Realism
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Navigation, headers, panels, and adjacent surfaces are intentionally restrained to feel native to an enterprise Chargebee product line.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                Integration posture
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                The workspace is designed around server-side integrations, deterministic replay logic, and dry-run-safe billing execution patterns.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
