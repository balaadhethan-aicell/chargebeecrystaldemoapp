import { NextResponse } from "next/server";
import { accountIdSchema } from "@/types/monetization";
import { getBillingDraft } from "@/services/billing-draft-service";
import { toErrorResponse } from "@/lib/errors";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const accountId = accountIdSchema.parse(params.id);
    const draft = await getBillingDraft(accountId);

    return NextResponse.json(draft);
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
