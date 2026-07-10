export function buildOutputSchema(): string {
  return `OUTPUT SCHEMA

Return EXACTLY this structure. Do not return anything else.

Subject:
<subject line>

Body:
<email body with greeting and paragraphs>

Signature:
<sign-off line>`;
}
