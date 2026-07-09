"use client";

import type { UsageStatus } from "@/types/plan";

interface UsageCircleProps {
  usage: UsageStatus;
  size?: number;
}

export function UsageCircle({ usage, size = 140 }: UsageCircleProps) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = usage.dailyLimit > 0 ? usage.dailyUsage / usage.dailyLimit : 0;
  const dashOffset = circumference * (1 - Math.min(progress, 1));

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${usage.dailyUsage} of ${usage.dailyLimit} emails used today`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="text-primary transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-semibold">{usage.dailyUsage}</span>
        <span className="text-xs text-muted-foreground">
          of {usage.dailyLimit}
        </span>
      </div>
    </div>
  );
}
