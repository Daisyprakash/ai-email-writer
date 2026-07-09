import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getUsageStatus } from "@/services/plan.service";

interface BillingErrorResponse {
  error: string;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<BillingErrorResponse>(
        { error: "Unauthorized. Please sign in to view usage." },
        { status: 401 }
      );
    }

    const usage = await getUsageStatus(session.user.id);

    if (!usage) {
      return NextResponse.json<BillingErrorResponse>(
        { error: "User account not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ usage });
  } catch (error) {
    console.error("Failed to fetch usage:", error);

    return NextResponse.json<BillingErrorResponse>(
      { error: "Unable to load usage information. Please try again." },
      { status: 500 }
    );
  }
}
