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

const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
