import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripeClient } from "@/lib/stripe";
import { fulfillPaidCheckout } from "@/services/checkout-fulfillment.service";
import {
  markPaymentExpired,
  markPaymentFailed,
  recordFailedPayment,
} from "@/services/payment.service";

export const runtime = "nodejs";

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  await fulfillPaidCheckout(session);
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  if (!session.id) return;
  await markPaymentExpired(session.id);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const sessionId =
    typeof paymentIntent.metadata?.checkoutSessionId === "string"
      ? paymentIntent.metadata.checkoutSessionId
      : null;

  if (sessionId) {
    await markPaymentFailed(sessionId);
    return;
  }

  const userId = paymentIntent.metadata?.userId;
  const planCode = paymentIntent.metadata?.planCode ?? "PRO";
  if (!userId) return;

  await recordFailedPayment({
    userId,
    stripeSessionId: `failed_${paymentIntent.id}`,
    stripePaymentIntent: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    purchasedPlanCode: planCode,
    purchasedPlanName: planCode,
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json(
      { error: "Webhook secret is not configured." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook verification failed:", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") {
          await handleCheckoutCompleted(session);
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook handler failed:", error);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
