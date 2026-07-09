import mongoose, { type InferSchemaType, Schema } from "mongoose";

import { EMAIL_LENGTHS, EMAIL_TONES } from "@/types/email";

const EmailSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    tone: {
      type: String,
      required: true,
      enum: EMAIL_TONES,
    },
    emailLength: {
      type: String,
      required: true,
      enum: EMAIL_LENGTHS,
    },
    additionalInstructions: {
      type: String,
      default: "",
      trim: true,
    },
    generatedEmail: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

EmailSchema.index({ userId: 1, createdAt: -1 });
EmailSchema.index({ userId: 1, prompt: "text", generatedEmail: "text" });

export type IEmail = InferSchemaType<typeof EmailSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const Email =
  mongoose.models.Email || mongoose.model<IEmail>("Email", EmailSchema);

export default Email;
