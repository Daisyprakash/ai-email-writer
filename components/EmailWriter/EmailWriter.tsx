"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { UpgradeDialog } from "@/components/Billing/UpgradeDialog";
import { UsageSummary } from "@/components/Billing/UsageSummary";
import { EmailForm } from "@/components/EmailForm/EmailForm";
import { GeneratedEmail } from "@/components/GeneratedEmail/GeneratedEmail";
import { Header } from "@/components/Header/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OUTPUT_VALIDATION_FAILED_DISPLAY_MESSAGE } from "@/lib/ai/output-validation/email-output.schema";
import {
  ADDITIONAL_INSTRUCTIONS_MAX_WORDS,
  PROMPT_MAX_WORDS,
  type EmailFormData,
  type GenerateEmailErrorResponse,
  type GenerateEmailResponse,
} from "@/types/email";
import type { UsageStatus } from "@/types/plan";
import { consumeGenerateEmailStream } from "@/utils/generate-email-stream";
import { exceedsWordLimit } from "@/utils/word-limit";

const DEFAULT_FORM_DATA: EmailFormData = {
  prompt: "",
  tone: "Professional",
  length: "Medium",
  additionalInstructions: "",
};

export function EmailWriter() {
  const [formData, setFormData] = useState<EmailFormData>(DEFAULT_FORM_DATA);
  const [generatedEmail, setGeneratedEmail] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [validationFailed, setValidationFailed] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const isGeneratingRef = useRef(false);

  const loadUsage = useCallback(async () => {
    try {
      const response = await fetch("/api/billing/usage");
      const result = (await response.json()) as
        | { usage: UsageStatus }
        | { error: string };

      if (response.ok && "usage" in result) {
        setUsage(result.usage);
      }
    } catch {
      // Usage display is optional on the writer page.
    }
  }, []);

  useEffect(() => {
    void loadUsage();
  }, [loadUsage]);

  const handleUpgrade = async () => {
    setIsUpgrading(true);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode: usage?.upgradePlan?.code,
        }),
      });
      const result = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !result.url) {
        throw new Error(result.error || "Unable to start checkout.");
      }

      window.location.href = result.url;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to start checkout. Please try again.";

      setError(message);
      setShowUpgradeDialog(false);
      setIsUpgrading(false);
    }
  };

  const generateEmail = useCallback(async (data: EmailFormData) => {
    if (isGeneratingRef.current) return;

    if (!data.prompt.trim()) {
      setError("Please describe the email you want to write.");
      return;
    }

    if (
      exceedsWordLimit(data.prompt, PROMPT_MAX_WORDS) ||
      exceedsWordLimit(
        data.additionalInstructions,
        ADDITIONAL_INSTRUCTIONS_MAX_WORDS
      )
    ) {
      setError("Please fix the word limit errors before generating.");
      return;
    }

    isGeneratingRef.current = true;
    setIsLoading(true);
    setGeneratedEmail("");
    setError(null);
    setSaveWarning(null);
    setValidationFailed(false);
    setShowUpgradeDialog(false);

    try {
      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: data.prompt,
          tone: data.tone,
          length: data.length,
          additionalInstructions: data.additionalInstructions || undefined,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        const result = (await response.json()) as
          | GenerateEmailResponse
          | GenerateEmailErrorResponse;

        if (!response.ok) {
          if (
            response.status === 429 &&
            "code" in result &&
            result.code === "USAGE_LIMIT_REACHED"
          ) {
            if (result.usage) {
              setUsage(result.usage);
            }

            if (result.canUpgrade) {
              setUpgradeMessage(result.error);
              setShowUpgradeDialog(true);
              return;
            }

            setError(result.error);
            return;
          }

          throw new Error(
            "error" in result
              ? result.error
              : "Failed to generate email. Please try again."
          );
        }

        if (!("generatedEmail" in result) || !result.generatedEmail) {
          throw new Error("No email was returned. Please try again.");
        }

        setGeneratedEmail(result.generatedEmail);

        if (result.usage) {
          setUsage(result.usage);
        }

        if (result.blocked && result.blockReason) {
          setError(result.blockReason);
          return;
        }

        if (result.saved === false) {
          setSaveWarning(
            "Your email was generated but could not be saved to history. Please try again later."
          );
        }

        return;
      }

      if (!response.ok) {
        throw new Error("Failed to generate email. Please try again.");
      }

      const finalEvent = await consumeGenerateEmailStream(response, (preview) => {
        if (preview) {
          setGeneratedEmail(preview);
        }
      });

      if (finalEvent.type === "error") {
        if (finalEvent.code === "USAGE_LIMIT_REACHED") {
          if (finalEvent.usage) {
            setUsage(finalEvent.usage);
          }

          if (finalEvent.canUpgrade) {
            setUpgradeMessage(finalEvent.error);
            setShowUpgradeDialog(true);
            return;
          }
        }

        throw new Error(finalEvent.error);
      }

      if (
        finalEvent.blocked &&
        finalEvent.blockCode === "OUTPUT_VALIDATION_FAILED"
      ) {
        setUsage(finalEvent.usage);
        setValidationFailed(true);
        return;
      }

      setGeneratedEmail(finalEvent.generatedEmail);
      setUsage(finalEvent.usage);

      if (finalEvent.blocked && finalEvent.blockReason) {
        setError(finalEvent.blockReason);
        return;
      }

      if (finalEvent.saved === false) {
        setSaveWarning(
          "Your email was generated but could not be saved to history. Please try again later."
        );
      }
    } catch (err) {
      const message =
        err instanceof TypeError
          ? "Network error. Please check your connection and try again."
          : err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.";

      setError(message);
      setGeneratedEmail(null);
    } finally {
      setIsLoading(false);
      isGeneratingRef.current = false;
    }
  }, []);

  const handleGenerate = () => {
    void generateEmail(formData);
  };

  const handleRegenerate = () => {
    void generateEmail(formData);
  };

  const handleClear = () => {
    setFormData(DEFAULT_FORM_DATA);
    setGeneratedEmail(null);
    setError(null);
    setSaveWarning(null);
    setValidationFailed(false);
  };

  return (
    <div className="relative min-h-full flex-1">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
        <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-muted/60 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <Header />
          {usage && <UsageSummary usage={usage} />}
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <Card className="h-fit shadow-sm">
            <CardHeader>
              <CardTitle>Email Details</CardTitle>
              <CardDescription>
                Tell us what you need and how you&apos;d like it written.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmailForm
                formData={formData}
                isLoading={isLoading}
                onChange={setFormData}
                onSubmit={handleGenerate}
              />
              {error && (
                <p
                  className="animate-in fade-in mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              )}
              {saveWarning && (
                <p
                  className="animate-in fade-in mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300"
                  role="status"
                >
                  {saveWarning}
                </p>
              )}
            </CardContent>
          </Card>

          <GeneratedEmail
            email={generatedEmail}
            isLoading={isLoading}
            validationFailed={validationFailed}
            validationFailedMessage={OUTPUT_VALIDATION_FAILED_DISPLAY_MESSAGE}
            onRegenerate={handleRegenerate}
            onClear={handleClear}
          />
        </div>
      </div>

      <UpgradeDialog
        open={showUpgradeDialog}
        message={upgradeMessage}
        isUpgrading={isUpgrading}
        upgradePlanName={usage?.upgradePlan?.name}
        onOpenChange={setShowUpgradeDialog}
        onUpgrade={() => {
          void handleUpgrade();
        }}
      />
    </div>
  );
}
