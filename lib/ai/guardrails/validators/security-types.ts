export type GuardrailLayer = "input" | "business" | "injection";

export type GuardrailRejection = {
  allowed: false;
  layer: GuardrailLayer;
  message: string;
  reasons: string[];
};

export type GuardrailSuccess = {
  allowed: true;
};

export type GuardrailResult = GuardrailRejection | GuardrailSuccess;

export const MAX_COMBINED_INPUT_CHARS = 10_000;

export const INJECTION_REJECTION_MESSAGE =
  "Your request was blocked for security reasons. Please describe only the email you want to write.";

export const BUSINESS_REJECTION_MESSAGE =
  "That request doesn't seem to be for generating an email. Please describe the email you'd like to write.";

export const INPUT_NO_TEXT_MESSAGE =
  "Please describe the email you want to write using words.";
