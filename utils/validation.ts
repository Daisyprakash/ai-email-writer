import {
  ADDITIONAL_INSTRUCTIONS_MAX_WORDS,
  EMAIL_LENGTHS,
  EMAIL_TONES,
  PROMPT_MAX_WORDS,
  type EmailLength,
  type EmailTone,
  type GenerateEmailRequest,
} from "@/types/email";
import { countWords, exceedsWordLimit } from "@/utils/word-limit";

export function isValidTone(value: string): value is EmailTone {
  return EMAIL_TONES.includes(value as EmailTone);
}

export function isValidLength(value: string): value is EmailLength {
  return EMAIL_LENGTHS.includes(value as EmailLength);
}

export function validateGenerateEmailRequest(
  body: unknown
): { success: true; data: GenerateEmailRequest } | { success: false; error: string } {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Invalid request body." };
  }

  const { prompt, tone, length, additionalInstructions } = body as Record<
    string,
    unknown
  >;

  if (typeof prompt !== "string" || !prompt.trim()) {
    return {
      success: false,
      error: "Please describe the email you want to write.",
    };
  }

  if (exceedsWordLimit(prompt, PROMPT_MAX_WORDS)) {
    return {
      success: false,
      error: `Description must be ${PROMPT_MAX_WORDS} words or fewer (currently ${countWords(prompt)}).`,
    };
  }

  if (typeof tone !== "string" || !isValidTone(tone)) {
    return { success: false, error: "Please select a valid email tone." };
  }

  if (typeof length !== "string" || !isValidLength(length)) {
    return { success: false, error: "Please select a valid email length." };
  }

  if (
    additionalInstructions !== undefined &&
    additionalInstructions !== null &&
    typeof additionalInstructions !== "string"
  ) {
    return {
      success: false,
      error: "Additional instructions must be text.",
    };
  }

  if (
    typeof additionalInstructions === "string" &&
    additionalInstructions.trim() &&
    exceedsWordLimit(additionalInstructions, ADDITIONAL_INSTRUCTIONS_MAX_WORDS)
  ) {
    return {
      success: false,
      error: `Additional instructions must be ${ADDITIONAL_INSTRUCTIONS_MAX_WORDS} words or fewer (currently ${countWords(additionalInstructions)}).`,
    };
  }

  return {
    success: true,
    data: {
      prompt: prompt.trim(),
      tone,
      length,
      additionalInstructions:
        typeof additionalInstructions === "string"
          ? additionalInstructions.trim()
          : undefined,
    },
  };
}

export function validateSaveEmailRequest(
  body: unknown
):
  | {
      success: true;
      data: {
        prompt: string;
        tone: EmailTone;
        length: EmailLength;
        additionalInstructions?: string;
        generatedEmail: string;
      };
    }
  | { success: false; error: string } {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Invalid request body." };
  }

  const { prompt, tone, length, additionalInstructions, generatedEmail } =
    body as Record<string, unknown>;

  if (typeof prompt !== "string" || !prompt.trim()) {
    return { success: false, error: "Prompt is required." };
  }

  if (typeof tone !== "string" || !isValidTone(tone)) {
    return { success: false, error: "Please provide a valid email tone." };
  }

  if (typeof length !== "string" || !isValidLength(length)) {
    return { success: false, error: "Please provide a valid email length." };
  }

  if (
    additionalInstructions !== undefined &&
    additionalInstructions !== null &&
    typeof additionalInstructions !== "string"
  ) {
    return {
      success: false,
      error: "Additional instructions must be text.",
    };
  }

  if (typeof generatedEmail !== "string" || !generatedEmail.trim()) {
    return { success: false, error: "Generated email content is required." };
  }

  return {
    success: true,
    data: {
      prompt: prompt.trim(),
      tone,
      length,
      additionalInstructions:
        typeof additionalInstructions === "string"
          ? additionalInstructions.trim()
          : undefined,
      generatedEmail: generatedEmail.trim(),
    },
  };
}
