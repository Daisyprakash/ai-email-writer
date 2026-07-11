export const EMAIL_TONES = [
  "Professional",
  "Friendly",
  "Formal",
  "Casual",
  "Persuasive",
  "Apologetic",
] as const;

export const EMAIL_LENGTHS = ["Short", "Medium", "Long"] as const;

export const PROMPT_MAX_WORDS = 100;
export const ADDITIONAL_INSTRUCTIONS_MAX_WORDS = 50;

export type EmailTone = (typeof EMAIL_TONES)[number];
export type EmailLength = (typeof EMAIL_LENGTHS)[number];

export interface GenerateEmailRequest {
  prompt: string;
  tone: EmailTone;
  length: EmailLength;
  additionalInstructions?: string;
}

export interface EmailFormData {
  prompt: string;
  tone: EmailTone;
  length: EmailLength;
  additionalInstructions: string;
}

export interface SavedEmail {
  id: string;
  userId: string;
  prompt: string;
  tone: EmailTone;
  length: EmailLength;
  additionalInstructions?: string;
  generatedEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedEmailSummary {
  id: string;
  prompt: string;
  generatedEmail: string;
  tone: EmailTone;
  length: EmailLength;
  createdAt: string;
}

import type { UsageStatus } from "@/types/plan";

export type GenerateEmailBlockCode = "OUTPUT_VALIDATION_FAILED";

export interface GenerateEmailResponse {
  generatedEmail: string;
  saved: boolean;
  usage: UsageStatus;
  /** Set when guardrails block the request before OpenAI is called. */
  blocked?: boolean;
  blockCode?: GenerateEmailBlockCode;
  /** User-facing reason shown in the red error banner. */
  blockReason?: string;
}

export interface GenerateEmailErrorResponse {
  error: string;
  code?: "USAGE_LIMIT_REACHED";
  canUpgrade?: boolean;
  usage?: UsageStatus;
}

export type GenerateEmailStreamEvent =
  | { type: "delta"; preview: string }
  | {
      type: "complete";
      generatedEmail: string;
      saved: boolean;
      usage: UsageStatus;
      blocked?: boolean;
      blockCode?: GenerateEmailBlockCode;
      blockReason?: string;
    }
  | {
      type: "error";
      error: string;
      code?: "USAGE_LIMIT_REACHED";
      canUpgrade?: boolean;
      usage?: UsageStatus;
    };

export interface EmailListResponse {
  emails: SavedEmailSummary[];
}

export interface EmailDetailResponse {
  email: SavedEmail;
}

export interface EmailDeleteResponse {
  message: string;
}

export interface EmailErrorResponse {
  error: string;
}
