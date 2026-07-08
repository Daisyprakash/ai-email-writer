"use client";

import { useCallback, useRef, useState } from "react";

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
import {
  ADDITIONAL_INSTRUCTIONS_MAX_WORDS,
  PROMPT_MAX_WORDS,
  type EmailFormData,
  type GenerateEmailErrorResponse,
  type GenerateEmailResponse,
} from "@/types/email";
import { exceedsWordLimit } from "@/utils/word-limit";

const DEFAULT_FORM_DATA: EmailFormData = {
  prompt: "",
  tone: "Professional",
  length: "Medium",
  additionalInstructions: "",
};

export default function HomePage() {
  const [formData, setFormData] = useState<EmailFormData>(DEFAULT_FORM_DATA);
  const [generatedEmail, setGeneratedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isGeneratingRef = useRef(false);

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
    setError(null);

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

      const result = (await response.json()) as
        | GenerateEmailResponse
        | GenerateEmailErrorResponse;

      if (!response.ok) {
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
    } catch (err) {
      const message =
        err instanceof TypeError
          ? "Network error. Please check your connection and try again."
          : err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.";

      setError(message);
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
  };

  return (
    <main className="relative min-h-full flex-1">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
        <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-muted/60 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
        <Header />

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
            </CardContent>
          </Card>

          <GeneratedEmail
            email={generatedEmail}
            isLoading={isLoading}
            onRegenerate={handleRegenerate}
            onClear={handleClear}
          />
        </div>
      </div>
    </main>
  );
}
