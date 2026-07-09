import mongoose, { type InferSchemaType, Schema } from "mongoose";

const PaymentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    stripeSessionId: {
      type: String,
      required: true,
      unique: true,
    },
    stripePaymentIntent: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "inr",
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["pending", "paid", "failed", "expired"],
      default: "pending",
    },
    purchasedPlanCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    purchasedPlanName: {
      type: String,
      required: true,
      trim: true,
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index({ userId: 1, purchasedAt: -1 });

export type IPayment = InferSchemaType<typeof PaymentSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

if (mongoose.models.Payment) {
  delete mongoose.models.Payment;
}

const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
