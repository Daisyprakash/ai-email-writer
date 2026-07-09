"use client";

import Link from "next/link";

import { UsageCircle } from "@/components/Billing/UsageCircle";
import type { UsageStatus } from "@/types/plan";

interface UsageSummaryProps {
  usage: UsageStatus;
}

function formatResetTime(isoDate: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(isoDate));
}

export function UsageSummary({ usage }: UsageSummaryProps) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-2 sm:items-end">
      <UsageCircle usage={usage} size={88} />
      <div className="max-w-[11rem] text-center text-xs text-muted-foreground sm:text-right">
        <p>
          {usage.dailyUsage} of {usage.dailyLimit} used today
        </p>
        <p>Resets at {formatResetTime(usage.resetsAt)}</p>
        {usage.canUpgrade && usage.upgradePlan && (
          <Link
            href="/billing"
            className="mt-1 inline-block font-medium text-foreground underline underline-offset-4"
          >
            Upgrade to {usage.upgradePlan.name}
          </Link>
        )}
      </div>
    </div>
  );
}
