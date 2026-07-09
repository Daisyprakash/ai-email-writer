export interface PlanDetails {
  code: string;
  name: string;
  description: string;
  priceInr: number;
  pricePaise: number;
  currency: string;
  dailyLimit: number;
  durationDays: number | null;
  isDefault: boolean;
  isPurchasable: boolean;
}

export interface UsageStatus {
  currentPlan: PlanDetails;
  dailyLimit: number;
  dailyUsage: number;
  remaining: number;
  resetsAt: string;
  planStartedAt: string | null;
  planExpiresAt: string | null;
  canUpgrade: boolean;
  upgradePlan: PlanDetails | null;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  purchasedPlanCode: string;
  purchasedPlanName: string;
  purchasedAt: string;
  stripeSessionId: string;
}

export interface PlansResponse {
  plans: PlanDetails[];
}
