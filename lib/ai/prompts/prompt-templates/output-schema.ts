import { buildOutputSchemaPrompt } from "@/lib/ai/output-validation/email-output.schema";

export function buildOutputSchema(): string {
  return buildOutputSchemaPrompt();
}
