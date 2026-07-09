"use client";

import Link from "next/link";
import { Calendar, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SavedEmailSummary } from "@/types/email";
import { formatEmailDate, truncateText } from "@/utils/format";

interface EmailHistoryItemProps {
  email: SavedEmailSummary;
  onDelete: (email: SavedEmailSummary) => void;
  isDeleting: boolean;
}

export function EmailHistoryItem({
  email,
  onDelete,
  isDeleting,
}: EmailHistoryItemProps) {
  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <CardTitle className="text-base leading-snug">
              <Link
                href={`/history/${email.id}`}
                className="transition-colors hover:text-primary"
              >
                {truncateText(email.prompt, 100)}
              </Link>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                {email.tone}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                {email.length}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="size-3.5" aria-hidden="true" />
                {formatEmailDate(email.createdAt)}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(email)}
            disabled={isDeleting}
            aria-label="Delete email"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <CardDescription className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-foreground/80">
          {truncateText(email.generatedEmail, 220)}
        </CardDescription>
        <Link
          href={`/history/${email.id}`}
          className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          View full email
        </Link>
      </CardContent>
    </Card>
  );
}
