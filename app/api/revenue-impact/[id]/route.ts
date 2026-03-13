import { NextResponse } from "next/server";
import { accountIdSchema, revenueWindowSchema } from "@/types/monetization";
import { getRevenueImpactSummary } from "@/services/revenue-impact-service";
import { toErrorResponse } from "@/lib/errors";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const accountId = accountIdSchema.parse(params.id);
    const searchParams = new URL(request.url).searchParams;
    const window = revenueWindowSchema.parse(searchParams.get("window") ?? "6m");
    const summary = await getRevenueImpactSummary(accountId, window);

    return NextResponse.json(summary);
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
