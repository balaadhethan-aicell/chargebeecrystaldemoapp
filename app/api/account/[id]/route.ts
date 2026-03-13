import { NextResponse } from "next/server";
import { accountIdSchema } from "@/types/monetization";
import { getAccountSummary } from "@/services/account-service";
import { toErrorResponse } from "@/lib/errors";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const accountId = accountIdSchema.parse(params.id);
    const account = await getAccountSummary(accountId);

    return NextResponse.json(account);
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
