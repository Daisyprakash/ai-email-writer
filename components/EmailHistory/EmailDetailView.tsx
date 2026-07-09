"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Calendar, Check, Copy } from "lucide-react";

import { DeleteEmailDialog } from "@/components/EmailHistory/DeleteEmailDialog";
import { EmailHistorySkeleton } from "@/components/EmailHistory/EmailHistorySkeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  EmailDetailResponse,
  EmailErrorResponse,
  SavedEmail,
} from "@/types/email";
import { formatEmailDate } from "@/utils/format";

interface EmailDetailViewProps {
  emailId: string;
}

export function EmailDetailView({ emailId }: EmailDetailViewProps) {
  const router = useRouter();
  const [email, setEmail] = useState<SavedEmail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEmail = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/emails/${emailId}`);
      const result = (await response.json()) as
        | EmailDetailResponse
        | EmailErrorResponse;

      if (!response.ok) {
        throw new Error(
          "error" in result ? result.error : "Unable to load this email."
        );
      }

      if (!("email" in result)) {
        throw new Error("Unable to load this email.");
      }

      setEmail(result.email);
    } catch (err) {
      const message =
        err instanceof TypeError
          ? "Network error. Please check your connection and try again."
          : err instanceof Error
            ? err.message
            : "Unable to load this email.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [emailId]);

  useEffect(() => {
    void fetchEmail();
  }, [fetchEmail]);

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    if (!email) return;

    try {
      await navigator.clipboard.writeText(email.generatedEmail);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as EmailErrorResponse | { message: string };

      if (!response.ok) {
        throw new Error(
          "error" in result ? result.error : "Unable to delete this email."
        );
      }

      router.push("/history");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof TypeError
          ? "Network error. Please check your connection and try again."
          : err instanceof Error
            ? err.message
            : "Unable to delete this email.";

      setError(message);
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <EmailHistorySkeleton />
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit gap-2"
          nativeButton={false}
          render={<Link href="/history" />}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to history
        </Button>

        <Card className="border-dashed shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="font-medium">
              {error || "This email could not be found."}
            </p>
            <Button
              className="mt-4"
              nativeButton={false}
              render={<Link href="/history" />}
            >
              Return to Email History
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit gap-2"
        nativeButton={false}
        render={<Link href="/history" />}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to history
      </Button>

      <Card className="animate-in fade-in slide-in-from-bottom-4 overflow-hidden shadow-sm duration-500">
        <CardHeader className="gap-4 border-b">
          <div className="space-y-2">
            <CardTitle className="text-xl leading-snug">{email.prompt}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                {email.tone}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                {email.length}
              </span>
              <span className="inline-flex items-center gap-1 text-xs">
                <Calendar className="size-3.5" aria-hidden="true" />
                {formatEmailDate(email.createdAt)}
              </span>
            </CardDescription>
          </div>

          {email.additionalInstructions && (
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                Additional instructions:
              </span>{" "}
              {email.additionalInstructions}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-6">
          <div className="whitespace-pre-wrap text-sm leading-7 text-foreground/90 sm:text-base">
            {email.generatedEmail}
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap gap-2 border-t bg-muted/30">
          <Button type="button" size="sm" onClick={handleCopy} className="gap-2">
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
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            Delete Email
          </Button>
        </CardFooter>
      </Card>

      <DeleteEmailDialog
        open={showDeleteDialog}
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setShowDeleteDialog(false);
          }
        }}
        onConfirm={() => {
          void handleDeleteConfirm();
        }}
      />
    </div>
  );
}
