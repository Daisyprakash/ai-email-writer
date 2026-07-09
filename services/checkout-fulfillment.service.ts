import type Stripe from "stripe";

import { connectDB } from "@/lib/mongodb";
import { getStripeClient } from "@/lib/stripe";
import Payment from "@/models/Payment";
import {
  findPaymentByStripeSessionId,
  markPaymentPaid,
} from "@/services/payment.service";
import { activatePlan } from "@/services/plan.service";

export interface CheckoutFulfillmentResult {
  fulfilled: boolean;
  planCode: string | null;
  message: string;
}

export async function fulfillPaidCheckout(
  session: Stripe.Checkout.Session
): Promise<CheckoutFulfillmentResult> {
  const userId = session.metadata?.userId;
  const planCode = session.metadata?.planCode ?? session.metadata?.purchasedPlan;

  if (!userId || !session.id || !planCode) {
    throw new Error("Checkout session is missing required metadata.");
  }

  if (session.payment_status !== "paid") {
    return {
      fulfilled: false,
      planCode: null,
      message: "Payment has not been completed yet.",
    };
  }

  const existingPayment = await findPaymentByStripeSessionId(session.id);
  const stripeCustomerId =
    typeof session.customer === "string" ? session.customer : null;

  if (existingPayment?.paymentStatus === "paid") {
    await activatePlan({
      userId,
      planCode,
      stripeCustomerId,
    });

    return {
      fulfilled: true,
      planCode: planCode.toUpperCase(),
      message: "Your plan is active.",
    };
  }

  await markPaymentPaid({
    stripeSessionId: session.id,
    stripePaymentIntent:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id,
  });

  await activatePlan({
    userId,
    planCode,
    stripeCustomerId,
  });

  return {
    fulfilled: true,
    planCode: planCode.toUpperCase(),
    message: "Payment confirmed. Your plan is now active.",
  };
}

export async function syncPendingCheckoutForUser(
  userId: string
): Promise<CheckoutFulfillmentResult | null> {
  await connectDB();

  const pendingPayment = await Payment.findOne({
    userId,
    paymentStatus: "pending",
  }).sort({ createdAt: -1 });

  if (!pendingPayment) {
    return null;
  }

  const stripe = getStripeClient();
  const checkoutSession = await stripe.checkout.sessions.retrieve(
    pendingPayment.stripeSessionId
  );

  if (checkoutSession.payment_status !== "paid") {
    return {
      fulfilled: false,
      planCode: null,
      message: "Your latest checkout is still pending payment confirmation.",
    };
  }

  return fulfillPaidCheckout(checkoutSession);
}
