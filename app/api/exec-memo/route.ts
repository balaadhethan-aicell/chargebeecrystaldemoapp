import { NextResponse } from "next/server";
import { execMemoRequestSchema } from "@/types/monetization";
import { getNarrativeBundle } from "@/services/memo-service";
import { toErrorResponse } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const body = execMemoRequestSchema.parse(await request.json().catch(() => ({})));
    const memo = await getNarrativeBundle(body.accountId);

    return NextResponse.json(memo);
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(response, { status: response.status });
  }
}
