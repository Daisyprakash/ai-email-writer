import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getStripeClient } from "@/lib/stripe";
import { fulfillPaidCheckout, syncPendingCheckoutForUser } from "@/services/checkout-fulfillment.service";
import { getUsageStatus } from "@/services/plan.service";

interface VerifyCheckoutRequest {
  sessionId?: string;
}

interface VerifyCheckoutResponse {
  message: string;
  fulfilled: boolean;
  usage: Awaited<ReturnType<typeof getUsageStatus>>;
}

interface VerifyCheckoutErrorResponse {
  error: string;
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<VerifyCheckoutErrorResponse>(
        { error: "Unauthorized. Please sign in to verify checkout." },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as VerifyCheckoutRequest;

    let result;

    if (body.sessionId?.trim()) {
      const stripe = getStripeClient();
      const checkoutSession = await stripe.checkout.sessions.retrieve(
        body.sessionId.trim()
      );

      if (checkoutSession.metadata?.userId !== session.user.id) {
        return NextResponse.json<VerifyCheckoutErrorResponse>(
          { error: "This checkout session does not belong to your account." },
          { status: 403 }
        );
      }

      result = await fulfillPaidCheckout(checkoutSession);
    } else {
      const synced = await syncPendingCheckoutForUser(session.user.id);

      if (!synced) {
        return NextResponse.json<VerifyCheckoutResponse>({
          message: "No pending checkout found to sync.",
          fulfilled: false,
          usage: await getUsageStatus(session.user.id),
        });
      }

      result = synced;
    }

    const usage = await getUsageStatus(session.user.id);

    return NextResponse.json<VerifyCheckoutResponse>({
      message: result.message,
      fulfilled: result.fulfilled,
      usage,
    });
  } catch (error) {
    console.error("Checkout verification failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to verify checkout. Please try again.";

    return NextResponse.json<VerifyCheckoutErrorResponse>(
      { error: message },
      { status: 500 }
    );
  }
}
