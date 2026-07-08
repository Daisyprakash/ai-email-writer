import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  label?: string;
}

export function LoadingSpinner({
  className,
  label = "Generating your email...",
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-8 text-center",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
