export const EMAIL_TONES = [
  "Professional",
  "Friendly",
  "Formal",
  "Casual",
  "Persuasive",
  "Apologetic",
] as const;

export const EMAIL_LENGTHS = ["Short", "Medium", "Long"] as const;

export type EmailTone = (typeof EMAIL_TONES)[number];
export type EmailLength = (typeof EMAIL_LENGTHS)[number];

export interface GenerateEmailRequest {
  prompt: string;
  tone: EmailTone;
  length: EmailLength;
  additionalInstructions?: string;
}

export interface GenerateEmailResponse {
  generatedEmail: string;
}

export interface GenerateEmailErrorResponse {
  error: string;
}

export interface EmailFormData {
  prompt: string;
  tone: EmailTone;
  length: EmailLength;
  additionalInstructions: string;
}
