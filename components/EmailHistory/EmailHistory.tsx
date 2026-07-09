"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { History, Search } from "lucide-react";

import { DeleteEmailDialog } from "@/components/EmailHistory/DeleteEmailDialog";
import { EmailHistoryItem } from "@/components/EmailHistory/EmailHistoryItem";
import { EmailHistorySkeleton } from "@/components/EmailHistory/EmailHistorySkeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  EmailErrorResponse,
  EmailListResponse,
  SavedEmailSummary,
} from "@/types/email";

export function EmailHistory() {
  const [emails, setEmails] = useState<SavedEmailSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailToDelete, setEmailToDelete] = useState<SavedEmailSummary | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEmails = useCallback(async (search: string, showSkeleton = false) => {
    if (showSkeleton) {
      setIsLoading(true);
    } else {
      setIsSearching(true);
    }

    setError(null);

    try {
      const params = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      const response = await fetch(`/api/emails${params}`);
      const result = (await response.json()) as
        | EmailListResponse
        | EmailErrorResponse;

      if (!response.ok) {
        throw new Error(
          "error" in result
            ? result.error
            : "Unable to load your email history."
        );
      }

      if (!("emails" in result)) {
        throw new Error("Unable to load your email history.");
      }

      setEmails(result.emails);
    } catch (err) {
      const message =
        err instanceof TypeError
          ? "Network error. Please check your connection and try again."
          : err instanceof Error
            ? err.message
            : "Unable to load your email history.";

      setError(message);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    void fetchEmails("", true);
  }, [fetchEmails]);

  useEffect(() => {
    if (isLoading) return;

    const timer = window.setTimeout(() => {
      void fetchEmails(searchQuery);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery, fetchEmails, isLoading]);

  const handleDeleteConfirm = async () => {
    if (!emailToDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/emails/${emailToDelete.id}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as EmailErrorResponse | { message: string };

      if (!response.ok) {
        throw new Error(
          "error" in result ? result.error : "Unable to delete this email."
        );
      }

      setEmails((current) =>
        current.filter((email) => email.id !== emailToDelete.id)
      );
      setEmailToDelete(null);
    } catch (err) {
      const message =
        err instanceof TypeError
          ? "Network error. Please check your connection and try again."
          : err instanceof Error
            ? err.message
            : "Unable to delete this email.";

      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const showEmptyState = !isLoading && !error && emails.length === 0;
  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Email History</h1>
        <p className="text-muted-foreground">
          Browse, search, and revisit your previously generated emails.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Search your emails</CardTitle>
          <CardDescription>
            Search by prompt or generated email content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search emails..."
              className="pl-9"
              disabled={isLoading}
              aria-label="Search email history"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      {isLoading ? (
        <EmailHistorySkeleton />
      ) : showEmptyState ? (
        <Card className="border-dashed bg-muted/20 shadow-sm">
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <History className="size-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {isSearchActive ? "No matching emails found" : "No emails generated yet"}
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                {isSearchActive
                  ? "Try a different search term or clear the search to see all emails."
                  : "Generate your first email to start building your history."}
              </p>
            </div>
            {!isSearchActive && (
              <Button nativeButton={false} render={<Link href="/app" />}>
                Generate Email
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {isSearching && (
            <p className="text-sm text-muted-foreground">Searching...</p>
          )}
          {emails.map((email) => (
            <EmailHistoryItem
              key={email.id}
              email={email}
              onDelete={setEmailToDelete}
              isDeleting={isDeleting && emailToDelete?.id === email.id}
            />
          ))}
        </div>
      )}

      <DeleteEmailDialog
        open={!!emailToDelete}
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setEmailToDelete(null);
          }
        }}
        onConfirm={() => {
          void handleDeleteConfirm();
        }}
      />
    </div>
  );
}
