import { Suspense } from "react";

import { BillingDashboard } from "@/components/Billing/BillingDashboard";

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
          Loading billing...
        </div>
      }
    >
      <BillingDashboard />
    </Suspense>
  );
}
