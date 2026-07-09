import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getPaymentsByUserId } from "@/services/payment.service";

interface BillingErrorResponse {
  error: string;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<BillingErrorResponse>(
        { error: "Unauthorized. Please sign in to view billing history." },
        { status: 401 }
      );
    }

    const payments = await getPaymentsByUserId(session.user.id);

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Failed to fetch billing history:", error);

    return NextResponse.json<BillingErrorResponse>(
      { error: "Unable to load billing history. Please try again." },
      { status: 500 }
    );
  }
}
