import {
  EMAIL_OUTPUT_FIELDS,
  type EmailOutput,
} from "@/lib/ai/output-validation/email-output.schema";

export type OutputValidationResult =
  | { valid: true; email: EmailOutput }
  | { valid: false; errors: string[] };

export function validateEmailOutput(
  record: Record<string, unknown>
): OutputValidationResult {
  const errors: string[] = [];
  const email: Partial<EmailOutput> = {};

  for (const field of EMAIL_OUTPUT_FIELDS) {
    const value = record[field.key];

    if (typeof value !== "string" || !value.trim()) {
      errors.push(`Missing or empty ${field.key}.`);
      continue;
    }

    email[field.key] = value.trim();
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, email: email as EmailOutput };
}
