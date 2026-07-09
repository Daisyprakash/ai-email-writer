import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getAppBaseUrl, getStripeClient } from "@/lib/stripe";
import { getPlanByCode } from "@/services/plan-catalog.service";
import { createPendingPayment } from "@/services/payment.service";
import {
  getUserBillingProfile,
  setStripeCustomerId,
} from "@/services/plan.service";

interface BillingErrorResponse {
  error: string;
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<BillingErrorResponse>(
        { error: "Unauthorized. Please sign in to upgrade." },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      planCode?: string;
    };

    const billingProfile = await getUserBillingProfile(session.user.id);

    if (!billingProfile) {
      return NextResponse.json<BillingErrorResponse>(
        { error: "User account not found." },
        { status: 404 }
      );
    }

    const targetPlanCode =
      body.planCode?.toUpperCase() ??
      billingProfile.usage.upgradePlan?.code ??
      null;

    if (!targetPlanCode) {
      return NextResponse.json<BillingErrorResponse>(
        { error: "No upgrade plan is available right now." },
        { status: 400 }
      );
    }

    const plan = await getPlanByCode(targetPlanCode);

    if (!plan || !plan.isPurchasable) {
      return NextResponse.json<BillingErrorResponse>(
        { error: "The selected plan is not available for purchase." },
        { status: 400 }
      );
    }

    if (!billingProfile.usage.canUpgrade) {
      return NextResponse.json<BillingErrorResponse>(
        { error: "You already have an active paid plan." },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    const baseUrl = getAppBaseUrl();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: billingProfile.stripeCustomerId ?? undefined,
      customer_email: billingProfile.stripeCustomerId
        ? undefined
        : billingProfile.email,
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            unit_amount: plan.pricePaise,
            product_data: {
              name: `${plan.name} Plan`,
              description: plan.description,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        planCode: plan.code,
      },
      success_url: `${baseUrl}/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/billing?checkout=cancelled`,
    });

    if (!checkoutSession.url) {
      return NextResponse.json<BillingErrorResponse>(
        { error: "Unable to start checkout. Please try again." },
        { status: 500 }
      );
    }

    await createPendingPayment({
      userId: session.user.id,
      stripeSessionId: checkoutSession.id,
      amount: plan.pricePaise,
      currency: plan.currency,
      purchasedPlanCode: plan.code,
      purchasedPlanName: plan.name,
    });

    if (
      typeof checkoutSession.customer === "string" &&
      !billingProfile.stripeCustomerId
    ) {
      await setStripeCustomerId(session.user.id, checkoutSession.customer);
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout session creation failed:", error);

    return NextResponse.json<BillingErrorResponse>(
      { error: "Unable to start checkout. Please try again later." },
      { status: 500 }
    );
  }
}
