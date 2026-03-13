"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookCopy,
  ChevronRight,
  LayoutDashboard,
  Search,
  Package2,
  Settings,
  Sparkles,
  Users2,
  Waves
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users2 },
  { href: "/monetization-twin/gorgias", label: "Monetization Twin", icon: Sparkles },
  { href: "/catalog", label: "Catalog", icon: BookCopy },
  { href: "/usage", label: "Usage", icon: Waves },
  { href: "/revenuestory", label: "RevenueStory", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-grid min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="print-hidden hidden w-[296px] shrink-0 border-r border-slate-200 bg-slate-50/90 panel-blur lg:flex lg:flex-col">
          <div className="px-4 pb-4 pt-5">
            <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-[#062c40] px-4 py-3 text-white shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/5">
                <Package2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  Chargebee Concept
                </p>
                <h1 className="text-[15px] font-semibold">Monetization Twin</h1>
              </div>
              <ChevronRight className="ml-auto h-4 w-4 text-white/60" />
            </div>
            <div className="mt-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">balaadhethan</p>
                  <p className="mt-1 text-sm text-slate-500">Gorgias design review workspace</p>
                </div>
                <Badge variant="warning">Test</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Search className="h-4 w-4 text-slate-500" />
                  Go to
                </div>
                <span className="text-xs font-semibold text-slate-400">⌘K</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 pb-4">
            <div className="space-y-1.5">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-3 py-2.5 text-[15px] transition-colors",
                      active
                        ? "border-slate-200 bg-white text-slate-950 shadow-sm"
                        : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className={cn("h-4 w-4", active ? "text-blue-600" : "text-slate-500")} />
                      {item.label}
                    </span>
                    {item.label === "Monetization Twin" ? (
                      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                        Live
                      </Badge>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-950">Runtime posture</p>
                <Badge variant="success">Stable</Badge>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                Server-side Chargebee reads, deterministic monetization replay, and dry-run-safe billing execution are enabled for public submission use.
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
