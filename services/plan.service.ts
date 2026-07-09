import { connectDB } from "@/lib/mongodb";
import User, { type IUser } from "@/models/User";
import {
  getDefaultPlan,
  getPlanByCode,
  getUpgradePlanFor,
} from "@/services/plan-catalog.service";
import {
  getDailyUsageCount,
  incrementDailyUsage as incrementUsageRecord,
  resetDailyUsageForToday,
} from "@/services/usage.service";
import type { PlanDetails, UsageStatus } from "@/types/plan";
import { getNextDailyResetTime } from "@/utils/date";

async function getEffectivePlanCode(user: IUser): Promise<string> {
  const defaultPlan = await getDefaultPlan();
  const assignedPlanCode = user.plan || defaultPlan.code;

  const assignedPlan = await getPlanByCode(assignedPlanCode);
  if (!assignedPlan) {
    return defaultPlan.code;
  }

  if (assignedPlan.isDefault || !assignedPlan.durationDays) {
    return assignedPlan.code;
  }

  if (!user.planExpiresAt) {
    return defaultPlan.code;
  }

  const expiresAt =
    user.planExpiresAt instanceof Date
      ? user.planExpiresAt
      : new Date(user.planExpiresAt as unknown as string);

  if (expiresAt > new Date()) {
    return assignedPlan.code;
  }

  return defaultPlan.code;
}

async function buildUsageStatus(user: IUser): Promise<UsageStatus> {
  const effectivePlanCode = await getEffectivePlanCode(user);
  const currentPlan =
    (await getPlanByCode(effectivePlanCode)) ?? (await getDefaultPlan());
  const dailyUsage = await getDailyUsageCount(user._id.toString());
  const upgradePlan = await getUpgradePlanFor(currentPlan.code);

  const planStartedAt = user.planStartedAt
    ? (user.planStartedAt instanceof Date
        ? user.planStartedAt
        : new Date(user.planStartedAt as unknown as string)
      ).toISOString()
    : null;

  const planExpiresAt = user.planExpiresAt
    ? (user.planExpiresAt instanceof Date
        ? user.planExpiresAt
        : new Date(user.planExpiresAt as unknown as string)
      ).toISOString()
    : null;

  const hasActivePaidPlan =
    !currentPlan.isDefault &&
    !!planExpiresAt &&
    new Date(planExpiresAt) > new Date();

  return {
    currentPlan,
    dailyLimit: currentPlan.dailyLimit,
    dailyUsage,
    remaining: Math.max(currentPlan.dailyLimit - dailyUsage, 0),
    resetsAt: getNextDailyResetTime().toISOString(),
    planStartedAt: hasActivePaidPlan ? planStartedAt : null,
    planExpiresAt: hasActivePaidPlan ? planExpiresAt : null,
    canUpgrade: !!upgradePlan && !hasActivePaidPlan,
    upgradePlan,
  };
}

export async function expirePlanIfNeeded(userId: string): Promise<void> {
  await connectDB();

  const user = await User.findById(userId);
  if (!user || !user.planExpiresAt) {
    return;
  }

  const expiresAt =
    user.planExpiresAt instanceof Date
      ? user.planExpiresAt
      : new Date(user.planExpiresAt as unknown as string);

  if (expiresAt <= new Date()) {
    const defaultPlan = await getDefaultPlan();
    user.plan = defaultPlan.code;
    user.planStartedAt = null;
    user.planExpiresAt = null;
    await user.save();
    await resetDailyUsageForToday(userId);
  }
}

export async function getUsageStatus(userId: string): Promise<UsageStatus | null> {
  await connectDB();
  await expirePlanIfNeeded(userId);

  const user = await User.findById(userId);
  if (!user) {
    return null;
  }

  return buildUsageStatus(user);
}

export async function assertCanGenerate(userId: string): Promise<
  | { allowed: true; usage: UsageStatus }
  | { allowed: false; usage: UsageStatus; canUpgrade: boolean }
> {
  await connectDB();
  await expirePlanIfNeeded(userId);

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  const usage = await buildUsageStatus(user);

  if (usage.dailyUsage >= usage.dailyLimit) {
    return {
      allowed: false,
      usage,
      canUpgrade: usage.canUpgrade,
    };
  }

  return {
    allowed: true,
    usage,
  };
}

export async function incrementDailyUsage(userId: string): Promise<UsageStatus> {
  await connectDB();
  await expirePlanIfNeeded(userId);

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  await incrementUsageRecord(userId);
  return buildUsageStatus(user);
}

export async function activatePlan({
  userId,
  planCode,
  stripeCustomerId,
}: {
  userId: string;
  planCode: string;
  stripeCustomerId?: string | null;
}): Promise<void> {
  await connectDB();

  const plan = await getPlanByCode(planCode);
  if (!plan || !plan.isPurchasable) {
    throw new Error(`Plan ${planCode} is not available for purchase.`);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  const previousPlanCode = user.plan;
  const now = new Date();
  const expiresAt = plan.durationDays
    ? new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
    : null;

  user.plan = plan.code;
  user.planStartedAt = now;
  user.planExpiresAt = expiresAt;

  if (stripeCustomerId) {
    user.stripeCustomerId = stripeCustomerId;
  }

  await user.save();

  if (previousPlanCode !== plan.code) {
    await resetDailyUsageForToday(userId);
  }
}

export async function setStripeCustomerId(
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  await connectDB();
  await User.findByIdAndUpdate(userId, { stripeCustomerId });
}

export async function getUserBillingProfile(userId: string) {
  await connectDB();
  await expirePlanIfNeeded(userId);

  const user = await User.findById(userId);
  if (!user) {
    return null;
  }

  return {
    email: user.email,
    stripeCustomerId: user.stripeCustomerId ?? null,
    usage: await buildUsageStatus(user),
  };
}

export async function getDefaultPlanCode(): Promise<string> {
  const defaultPlan = await getDefaultPlan();
  return defaultPlan.code;
}
