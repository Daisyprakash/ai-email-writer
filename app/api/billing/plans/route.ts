import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getAllActivePlans } from "@/services/plan-catalog.service";

interface BillingErrorResponse {
  error: string;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<BillingErrorResponse>(
        { error: "Unauthorized. Please sign in to view plans." },
        { status: 401 }
      );
    }

    const plans = await getAllActivePlans();

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Failed to fetch plans:", error);

    return NextResponse.json<BillingErrorResponse>(
      { error: "Unable to load plans. Please try again." },
      { status: 500 }
    );
  }
}
