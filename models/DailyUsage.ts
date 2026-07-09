import mongoose, { type InferSchemaType, Schema } from "mongoose";

const DailyUsageSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    usageDate: {
      type: String,
      required: true,
      trim: true,
    },
    count: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

DailyUsageSchema.index({ userId: 1, usageDate: 1 }, { unique: true });

export type IDailyUsage = InferSchemaType<typeof DailyUsageSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const DailyUsage =
  mongoose.models.DailyUsage ||
  mongoose.model<IDailyUsage>("DailyUsage", DailyUsageSchema);

export default DailyUsage;
