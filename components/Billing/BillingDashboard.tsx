"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

import { UsageCircle } from "@/components/Billing/UsageCircle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PaymentRecord, PlanDetails, UsageStatus } from "@/types/plan";
import { formatEmailDate } from "@/utils/format";

function formatInr(amount: number, currency = "inr"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatResetTime(isoDate: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(isoDate));
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    case "expired":
      return "Expired";
    default:
      return "Pending";
  }
}

export function BillingDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get("checkout");
  const checkoutSessionId = searchParams.get("session_id");

  const [usage, setUsage] = useState<UsageStatus | null>(null);
  const [plans, setPlans] = useState<PlanDetails[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadBillingData = useCallback(async () => {
    setError(null);

    try {
      const [usageResponse, plansResponse, historyResponse] = await Promise.all([
        fetch("/api/billing/usage"),
        fetch("/api/billing/plans"),
        fetch("/api/billing/history"),
      ]);

      const usageResult = (await usageResponse.json()) as
        | { usage: UsageStatus }
        | { error: string };
      const plansResult = (await plansResponse.json()) as
        | { plans: PlanDetails[] }
        | { error: string };
      const historyResult = (await historyResponse.json()) as
        | { payments: PaymentRecord[] }
        | { error: string };

      if (!usageResponse.ok || !("usage" in usageResult)) {
        throw new Error(
          "error" in usageResult
            ? usageResult.error
            : "Unable to load usage information."
        );
      }

      if (!plansResponse.ok || !("plans" in plansResult)) {
        throw new Error(
          "error" in plansResult
            ? plansResult.error
            : "Unable to load plan details."
        );
      }

      if (!historyResponse.ok || !("payments" in historyResult)) {
        throw new Error(
          "error" in historyResult
            ? historyResult.error
            : "Unable to load billing history."
        );
      }

      setUsage(usageResult.usage);
      setPlans(plansResult.plans);
      setPayments(historyResult.payments);

      const hasPendingPayment = historyResult.payments.some(
        (payment) => payment.paymentStatus === "pending"
      );

      if (hasPendingPayment) {
        const syncResponse = await fetch("/api/billing/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const syncResult = (await syncResponse.json()) as
          | {
              fulfilled: boolean;
              usage?: UsageStatus;
              message: string;
            }
          | { error: string };

        if (syncResponse.ok && "fulfilled" in syncResult && syncResult.fulfilled) {
          if (syncResult.usage) {
            setUsage(syncResult.usage);
          }
          setNotice(syncResult.message);
        }
      }
    } catch (err) {
      const message =
        err instanceof TypeError
          ? "Network error. Please check your connection and try again."
          : err instanceof Error
            ? err.message
            : "Unable to load billing information.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBillingData();
  }, [loadBillingData]);

  useEffect(() => {
    if (checkoutStatus === "success") {
      const verifyCheckout = async () => {
        try {
          if (checkoutSessionId) {
            const response = await fetch("/api/billing/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId: checkoutSessionId }),
            });
            const result = (await response.json()) as
              | {
                  message: string;
                  fulfilled: boolean;
                  usage?: UsageStatus;
                }
              | { error: string };

            if (response.ok && "message" in result) {
              if (result.usage) {
                setUsage(result.usage);
              }

              setNotice(result.message);
              await loadBillingData();
              router.replace("/billing");
              return;
            }

            if ("error" in result) {
              setNotice(
                `${result.error} Your payment may still be processing. Refresh this page in a moment.`
              );
            }
          } else {
            setNotice(
              "Payment received. Refresh this page in a moment if your plan has not updated yet."
            );
          }
        } catch {
          setNotice(
            "Payment received. Refresh this page in a moment if your plan has not updated yet."
          );
        } finally {
          void loadBillingData();
          router.replace("/billing");
        }
      };

      void verifyCheckout();
      return;
    }

    if (checkoutStatus === "cancelled") {
      setNotice("Checkout was cancelled. You can upgrade anytime from this page.");
      router.replace("/billing");
    }
  }, [checkoutStatus, checkoutSessionId, loadBillingData, router]);

  const handleUpgrade = async (planCode: string) => {
    setIsUpgrading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
      });
      const result = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !result.url) {
        throw new Error(result.error || "Unable to start checkout.");
      }

      window.location.href = result.url;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to start checkout. Please try again.";

      setError(message);
      setIsUpgrading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const upgradePlan = usage?.upgradePlan;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your plan, daily usage, and payment history.
        </p>
      </div>

      {notice && (
        <p
          className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm"
          role="status"
        >
          {notice}
        </p>
      )}

      {error && (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      {usage && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Usage Dashboard</CardTitle>
              <CardDescription>
                Track your daily email generations and remaining quota.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <UsageCircle usage={usage} />
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Current Plan</p>
                  <p className="text-lg font-medium">{usage.currentPlan.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Today&apos;s Usage</p>
                  <p className="font-medium">
                    {usage.dailyUsage} / {usage.dailyLimit} used
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Remaining</p>
                  <p className="font-medium">{usage.remaining}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Next Reset</p>
                  <p className="font-medium">{formatResetTime(usage.resetsAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>{usage.currentPlan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="text-xl font-semibold">{usage.currentPlan.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {usage.currentPlan.dailyLimit} emails per day
                </p>
              </div>

              {usage.planExpiresAt && (
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">Expires On</p>
                  <p className="font-medium">
                    {formatEmailDate(usage.planExpiresAt)}
                  </p>
                </div>
              )}

              {usage.canUpgrade && upgradePlan ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {upgradePlan.description}
                  </p>
                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      void handleUpgrade(upgradePlan.code);
                    }}
                    disabled={isUpgrading}
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        Redirecting to Stripe...
                      </>
                    ) : (
                      <>
                        <CreditCard className="size-4" aria-hidden="true" />
                        Upgrade to {upgradePlan.name} —{" "}
                        {formatInr(upgradePlan.priceInr, upgradePlan.currency)}
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Your {usage.currentPlan.name} plan is active. After it expires,
                  you will automatically return to the default plan.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Plan details loaded from the platform catalog.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => (
            <div key={plan.code} className="rounded-lg border p-4">
              <p className="font-medium">{plan.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {plan.description}
              </p>
              <p className="mt-3 text-sm">
                {formatInr(plan.priceInr, plan.currency)}
                {plan.durationDays
                  ? ` · ${plan.durationDays} days`
                  : " · Default plan"}
              </p>
              <p className="text-sm text-muted-foreground">
                {plan.dailyLimit} emails per day
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Recent purchases and payment status.</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No purchases yet. Upgrade your plan to see billing history here.
            </p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{payment.purchasedPlanName} Plan</p>
                    <p className="text-sm text-muted-foreground">
                      {formatEmailDate(payment.purchasedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      {formatInr(payment.amount / 100, payment.currency)}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                      {getStatusLabel(payment.paymentStatus)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Need to generate emails?{" "}
        <Link href="/app" className="font-medium underline underline-offset-4">
          Go to Email Writer
        </Link>
      </p>
    </div>
  );
}
