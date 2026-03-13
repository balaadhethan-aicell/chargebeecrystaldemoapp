import { NextResponse } from "next/server";
import { billingPreviewRequestSchema } from "@/types/monetization";
import { previewBillingDraft } from "@/services/billing-draft-service";
import { toErrorResponse } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const body = billingPreviewRequestSchema.parse(await request.json().catch(() => ({})));
    const preview = await previewBillingDraft(body.accountId, body.includedSegments);

    return NextResponse.json(preview);
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
