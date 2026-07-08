import {
  EMAIL_LENGTHS,
  EMAIL_TONES,
  type EmailLength,
  type EmailTone,
  type GenerateEmailRequest,
} from "@/types/email";

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
