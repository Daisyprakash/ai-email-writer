"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface UpgradeDialogProps {
  open: boolean;
  message: string;
  isUpgrading: boolean;
  upgradePlanName?: string | null;
  onOpenChange: (open: boolean) => void;
  onUpgrade: () => void;
}

export function UpgradeDialog({
  open,
  message,
  isUpgrading,
  upgradePlanName,
  onOpenChange,
  onUpgrade,
}: UpgradeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Daily limit reached</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isUpgrading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isUpgrading}
            onClick={(event) => {
              event.preventDefault();
              onUpgrade();
            }}
          >
            {isUpgrading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Redirecting...
              </>
            ) : (
              `Upgrade to ${upgradePlanName ?? "a paid plan"}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
        <p className="px-4 pb-4 text-center text-xs text-muted-foreground">
          Or visit the{" "}
          <Link href="/billing" className="underline underline-offset-4">
            Billing page
          </Link>{" "}
          for plan details.
        </p>
      </AlertDialogContent>
    </AlertDialog>
  );
}
