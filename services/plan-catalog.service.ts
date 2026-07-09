import { connectDB } from "@/lib/mongodb";
import Plan, { type IPlan } from "@/models/Plan";
import type { PlanDetails } from "@/types/plan";

function toPlanDetails(plan: IPlan): PlanDetails {
  return {
    code: plan.code,
    name: plan.name,
    description: plan.description,
    priceInr: plan.priceInr,
    pricePaise: plan.priceInr * 100,
    currency: plan.currency,
    dailyLimit: plan.dailyLimit,
    durationDays: plan.durationDays ?? null,
    isDefault: plan.isDefault,
    isPurchasable: plan.isPurchasable,
  };
}

export async function getAllActivePlans(): Promise<PlanDetails[]> {
  await connectDB();

  const plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1 });
  return plans.map(toPlanDetails);
}

export async function getPlanByCode(code: string): Promise<PlanDetails | null> {
  await connectDB();

  const plan = await Plan.findOne({ code: code.toUpperCase(), isActive: true });
  return plan ? toPlanDetails(plan) : null;
}

export async function getDefaultPlan(): Promise<PlanDetails> {
  await connectDB();

  const plan = await Plan.findOne({ isDefault: true, isActive: true }).sort({
    sortOrder: 1,
  });

  if (!plan) {
    throw new Error(
      "Default plan is not configured in the database."
    );
  }

  return toPlanDetails(plan);
}

export async function getUpgradePlanFor(
  currentPlanCode: string
): Promise<PlanDetails | null> {
  await connectDB();

  const currentPlan = await Plan.findOne({
    code: currentPlanCode.toUpperCase(),
    isActive: true,
  });

  if (!currentPlan) {
    return null;
  }

  const upgradePlan = await Plan.findOne({
    isActive: true,
    isPurchasable: true,
    dailyLimit: { $gt: currentPlan.dailyLimit },
  }).sort({ sortOrder: 1 });

  return upgradePlan ? toPlanDetails(upgradePlan) : null;
}
