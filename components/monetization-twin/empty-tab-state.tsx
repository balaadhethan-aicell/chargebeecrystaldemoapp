import { LockKeyhole } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyTabState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="bg-white/95">
      <CardContent className="flex min-h-[240px] flex-col items-center justify-center p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
          <LockKeyhole className="h-5 w-5 text-slate-500" />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">{description}</p>
      </CardContent>
    </Card>
  );
}
