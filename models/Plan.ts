import mongoose, { type InferSchemaType, Schema } from "mongoose";

const PlanSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priceInr: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "inr",
      lowercase: true,
      trim: true,
    },
    dailyLimit: {
      type: Number,
      required: true,
      min: 1,
    },
    durationDays: {
      type: Number,
      default: null,
      min: 1,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isPurchasable: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

PlanSchema.index({ isActive: 1, sortOrder: 1 });

export type IPlan = InferSchemaType<typeof PlanSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const Plan = mongoose.models.Plan || mongoose.model<IPlan>("Plan", PlanSchema);

export default Plan;
