"use client";

import { useEffect, useState } from "react";
import { Check, Copy, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/Loading/LoadingSpinner";
import { cn } from "@/lib/utils";

interface GeneratedEmailProps {
  email: string | null;
  isLoading: boolean;
  validationFailed?: boolean;
  validationFailedMessage?: string;
  onRegenerate: () => void;
  onClear: () => void;
}

export function GeneratedEmail({
  email,
  isLoading,
  validationFailed = false,
  validationFailedMessage,
  onRegenerate,
  onClear,
}: GeneratedEmailProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    if (!email || validationFailed) return;

    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  if (email === null && !isLoading) {
    return (
      <Card className="animate-in fade-in duration-500 border-dashed bg-muted/20">
        <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <Copy className="size-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">Your email will appear here</p>
            <p className="text-sm text-muted-foreground">
              Fill in the form and click Generate to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4 overflow-hidden duration-500 fill-mode-both",
        isLoading && "opacity-90"
      )}
    >
      <CardHeader className="border-b">
        <CardTitle>Generated Email</CardTitle>
        <CardDescription>
          {isLoading
            ? "Your email is being written..."
            : validationFailed
              ? "This response could not be saved."
              : "Review, copy, or regenerate a new variation."}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        {isLoading && !email ? (
          <LoadingSpinner />
        ) : (
          <div className="relative min-h-32">
            <div
              className={cn(
                "whitespace-pre-wrap text-sm leading-7 text-foreground/90 sm:text-base",
                validationFailed &&
                  "pointer-events-none select-none blur-[2px] opacity-50"
              )}
              aria-hidden={validationFailed}
            >
              {email}
              {isLoading && (
                <span
                  className="ml-0.5 inline-block h-[1.1em] w-0.5 animate-pulse bg-primary align-[-0.15em]"
                  aria-hidden="true"
                />
              )}
            </div>

            {validationFailed && validationFailedMessage && (
              <div
                className="absolute inset-0 flex items-center justify-center p-4"
                role="alert"
              >
                <p className="max-w-sm rounded-lg border border-destructive/30 bg-background/95 px-4 py-3 text-center text-sm text-destructive shadow-sm backdrop-blur-sm">
                  {validationFailedMessage}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {email && !isLoading && (
        <CardFooter className="flex flex-wrap gap-2 border-t bg-muted/30">
          {!validationFailed && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="size-4" aria-hidden="true" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="size-4" aria-hidden="true" />
                  Copy Email
                </>
              )}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            className="gap-2"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Regenerate
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="gap-2 text-muted-foreground"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Clear
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
