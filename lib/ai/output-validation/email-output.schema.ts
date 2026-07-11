export const EMAIL_OUTPUT_FIELDS = [
  {
    key: "subject",
    description: "email subject line",
    contentRule: "The email subject line.",
  },
  {
    key: "body",
    description: "greeting and main paragraphs",
    contentRule: "The greeting and main email content.",
  },
  {
    key: "signature",
    description: "closing and sender name",
    contentRule: "The closing and sender name.",
  },
] as const;

export type EmailOutputFieldKey =
  (typeof EMAIL_OUTPUT_FIELDS)[number]["key"];

export type EmailOutput = {
  [K in EmailOutputFieldKey]: string;
};

export const OUTPUT_VALIDATION_FAILED_MESSAGE =
  "Sorry, we couldn't generate a valid email. Please try again.";

export function buildRequiredOutputFieldsCommand(): string {
  const fieldLines = EMAIL_OUTPUT_FIELDS.map(
    (field) => `- ${field.key} (required): ${field.contentRule}`
  ).join("\n");

  const fieldNames = EMAIL_OUTPUT_FIELDS.map((field) => field.key).join(", ");

  return `CRITICAL — REQUIRED OUTPUT FIELDS

The following fields are mandatory in your JSON response. You must include every one of them: ${fieldNames}.

${fieldLines}

Do not merge fields into each other. Each required field must stay separate and contain only the content defined for that field.`;
}

export function buildEmailOutputJsonSchema() {
  const properties = Object.fromEntries(
    EMAIL_OUTPUT_FIELDS.map((field) => [
      field.key,
      {
        type: "string" as const,
        description: field.description,
      },
    ])
  );

  return {
    type: "object" as const,
    properties,
    required: EMAIL_OUTPUT_FIELDS.map((field) => field.key),
    additionalProperties: false,
  };
}

export function buildOutputSchemaPrompt(): string {
  const jsonShape = EMAIL_OUTPUT_FIELDS.map(
    (field) => `  "${field.key}": "<${field.description}>"`
  ).join(",\n");

  const fieldNames = EMAIL_OUTPUT_FIELDS.map((field) => field.key).join(", ");

  return `OUTPUT SCHEMA

Return ONLY a single JSON object. Do not wrap it in markdown. Do not add commentary.

${buildRequiredOutputFieldsCommand()}

JSON shape:
{
${jsonShape}
}

Rules:
- Every field listed above is required — the API will reject responses missing any field.
- Each field must be a plain text string with non-empty content.
- Do not include markdown or code in any field.
- Do not merge fields into each other. Keep all required fields separate and follow the field list above.`;
}

export function formatEmailForDisplay(email: EmailOutput): string {
  return `Subject:\n${email.subject}\n\nBody:\n${email.body}\n\nSignature:\n${email.signature}`;
}

export function extractJsonContent(raw: string): string {
  const trimmed = raw.trim();

  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }

  return trimmed;
}

export function parseEmailOutputJson(
  raw: string
): { success: true; record: Record<string, unknown> } | { success: false } {
  try {
    const parsed = JSON.parse(extractJsonContent(raw));

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { success: false };
    }

    return { success: true, record: parsed as Record<string, unknown> };
  } catch {
    return { success: false };
  }
}
