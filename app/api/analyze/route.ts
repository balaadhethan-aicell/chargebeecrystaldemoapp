import { NextResponse } from "next/server";
import { analyzeRequestSchema } from "@/types/monetization";
import { getMonetizationAnalysis } from "@/services/monetization-analysis-service";
import { toErrorResponse } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const body = analyzeRequestSchema.parse(await request.json().catch(() => ({})));
    const analysis = await getMonetizationAnalysis(body.accountId);

    return NextResponse.json(analysis);
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
