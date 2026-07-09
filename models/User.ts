import mongoose, { type InferSchemaType, Schema } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    image: {
      type: String,
    },
    provider: {
      type: String,
      required: true,
      enum: ["credentials", "google"],
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },
    password: {
      type: String,
      select: false,
    },
    plan: {
      type: String,
      default: "FREE",
      uppercase: true,
      trim: true,
    },
    planStartedAt: {
      type: Date,
      default: null,
    },
    planExpiresAt: {
      type: Date,
      default: null,
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export type IUser = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

if (mongoose.models.User) {
  delete mongoose.models.User;
}

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
