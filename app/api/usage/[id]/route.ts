import { NextResponse } from "next/server";
import { accountIdSchema } from "@/types/monetization";
import { getUsageSummary } from "@/services/usage-service";
import { toErrorResponse } from "@/lib/errors";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const accountId = accountIdSchema.parse(params.id);
    const usage = await getUsageSummary(accountId);

    return NextResponse.json(usage);
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
