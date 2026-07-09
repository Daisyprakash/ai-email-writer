import { getDefaultPlanCode } from "@/services/plan.service";
import { connectDB } from "@/lib/mongodb";
import User, { type IUser } from "@/models/User";
import type { AuthProvider, UserProfile } from "@/types/user";
import { comparePasswordHashes } from "@/utils/password.server";

export type LoginErrorCode = "USER_NOT_FOUND" | "INVALID_PASSWORD";

export class LoginError extends Error {
  code: LoginErrorCode;

  constructor(code: LoginErrorCode) {
    super(code);
    this.name = "LoginError";
    this.code = code;
  }
}

function toUserProfile(user: IUser): UserProfile {
  const createdAt =
    user.createdAt instanceof Date
      ? user.createdAt
      : new Date(user.createdAt as unknown as string);

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image ?? undefined,
    provider: user.provider as AuthProvider,
    role: user.role as UserProfile["role"],
    createdAt: createdAt.toISOString(),
  };
}

export async function findUserByEmail(email: string) {
  await connectDB();
  return User.findOne({ email: email.toLowerCase() });
}

export async function findUserById(id: string) {
  await connectDB();
  return User.findById(id);
}

export async function getUserProfileByEmail(
  email: string
): Promise<UserProfile | null> {
  const user = await findUserByEmail(email);
  return user ? toUserProfile(user) : null;
}

export async function getUserProfileById(
  id: string
): Promise<UserProfile | null> {
  const user = await findUserById(id);
  return user ? toUserProfile(user) : null;
}

export async function createCredentialsUser({
  name,
  email,
  passwordHash,
}: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<UserProfile> {
  await connectDB();

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const defaultPlanCode = await getDefaultPlanCode();

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    provider: "credentials",
    role: "user",
    password: passwordHash,
    plan: defaultPlanCode,
  });

  return toUserProfile(user);
}

export async function validateCredentialsUser(
  email: string,
  passwordHash: string
): Promise<UserProfile> {
  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+password"
  );

  if (!user?.password) {
    throw new LoginError("USER_NOT_FOUND");
  }

  const isValidPassword = comparePasswordHashes(user.password, passwordHash);

  if (!isValidPassword) {
    throw new LoginError("INVALID_PASSWORD");
  }

  return toUserProfile(user);
}
