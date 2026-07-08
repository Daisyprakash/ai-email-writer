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
  onRegenerate: () => void;
  onClear: () => void;
}

export function GeneratedEmail({
  email,
  isLoading,
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
    if (!email) return;

    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  if (!email && !isLoading) {
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
          Review, copy, or regenerate a new variation.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-7 text-foreground/90 sm:text-base">
            {email}
          </div>
        )}
      </CardContent>

      {email && !isLoading && (
        <CardFooter className="flex flex-wrap gap-2 border-t bg-muted/30">
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
