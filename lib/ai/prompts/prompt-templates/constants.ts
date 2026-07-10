import type { EmailLength } from "@/types/email";

export const NO_VALID_REQUEST_MESSAGE =
  "I couldn't identify a valid email request. Please describe the email you'd like me to help write.";

export const LENGTH_GUIDANCE: Record<EmailLength, string> = {
  Short:
    "Keep the email brief — about 2–4 sentences in the body, excluding greeting and closing.",
  Medium:
    "Write a moderate-length email — about 2–3 short paragraphs in the body, excluding greeting and closing.",
  Long: "Write a detailed email — about 4–5 paragraphs in the body with thorough coverage, excluding greeting and closing.",
};
