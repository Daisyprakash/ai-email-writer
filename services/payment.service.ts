import { connectDB } from "@/lib/mongodb";
import Payment, { type IPayment } from "@/models/Payment";
import type { PaymentRecord } from "@/types/plan";

function toPaymentRecord(payment: IPayment): PaymentRecord {
  const purchasedAt =
    payment.purchasedAt instanceof Date
      ? payment.purchasedAt
      : new Date(payment.purchasedAt as unknown as string);

  return {
    id: payment._id.toString(),
    amount: payment.amount,
    currency: payment.currency,
    paymentStatus: payment.paymentStatus,
    purchasedPlanCode: payment.purchasedPlanCode,
    purchasedPlanName: payment.purchasedPlanName,
    purchasedAt: purchasedAt.toISOString(),
    stripeSessionId: payment.stripeSessionId,
  };
}

export async function createPendingPayment({
  userId,
  stripeSessionId,
  amount,
  currency,
  purchasedPlanCode,
  purchasedPlanName,
}: {
  userId: string;
  stripeSessionId: string;
  amount: number;
  currency: string;
  purchasedPlanCode: string;
  purchasedPlanName: string;
}) {
  await connectDB();

  return Payment.create({
    userId,
    stripeSessionId,
    amount,
    currency,
    paymentStatus: "pending",
    purchasedPlanCode,
    purchasedPlanName,
  });
}

export async function getPaymentsByUserId(
  userId: string
): Promise<PaymentRecord[]> {
  await connectDB();

  const payments = await Payment.find({ userId })
    .sort({ purchasedAt: -1 })
    .limit(20);

  return payments.map(toPaymentRecord);
}

export async function findPaymentByStripeSessionId(stripeSessionId: string) {
  await connectDB();
  return Payment.findOne({ stripeSessionId });
}

export async function markPaymentPaid({
  stripeSessionId,
  stripePaymentIntent,
}: {
  stripeSessionId: string;
  stripePaymentIntent?: string | null;
}) {
  await connectDB();

  return Payment.findOneAndUpdate(
    { stripeSessionId },
    {
      paymentStatus: "paid",
      stripePaymentIntent: stripePaymentIntent ?? undefined,
      purchasedAt: new Date(),
    },
    { new: true }
  );
}

export async function markPaymentFailed(stripeSessionId: string) {
  await connectDB();

  return Payment.findOneAndUpdate(
    { stripeSessionId },
    { paymentStatus: "failed" },
    { new: true }
  );
}

export async function markPaymentExpired(stripeSessionId: string) {
  await connectDB();

  return Payment.findOneAndUpdate(
    { stripeSessionId },
    { paymentStatus: "expired" },
    { new: true }
  );
}

export async function recordFailedPayment({
  userId,
  stripeSessionId,
  stripePaymentIntent,
  amount,
  currency,
  purchasedPlanCode,
  purchasedPlanName,
}: {
  userId: string;
  stripeSessionId: string;
  stripePaymentIntent?: string | null;
  amount: number;
  currency: string;
  purchasedPlanCode: string;
  purchasedPlanName: string;
}) {
  await connectDB();

  const existing = await Payment.findOne({ stripeSessionId });
  if (existing) {
    existing.paymentStatus = "failed";
    if (stripePaymentIntent) {
      existing.stripePaymentIntent = stripePaymentIntent;
    }
    await existing.save();
    return existing;
  }

  return Payment.create({
    userId,
    stripeSessionId,
    stripePaymentIntent: stripePaymentIntent ?? undefined,
    amount,
    currency,
    paymentStatus: "failed",
    purchasedPlanCode,
    purchasedPlanName,
  });
}
