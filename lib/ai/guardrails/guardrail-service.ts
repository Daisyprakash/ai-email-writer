import { validateBusinessRules } from "@/lib/ai/guardrails/validators/business-validator";
import { validateInput } from "@/lib/ai/guardrails/validators/input-validator";
import { detectPromptInjection } from "@/lib/ai/guardrails/validators/prompt-injection-detector";
import type { GuardrailResult } from "@/lib/ai/guardrails/validators/security-types";

export function buildGuardrailInput(
  prompt: string,
  additionalInstructions?: string
): string {
  const parts = [prompt.trim()];

  if (additionalInstructions?.trim()) {
    parts.push(additionalInstructions.trim());
  }

  return parts.join("\n\n");
}

function logGuardrailRejection(result: GuardrailResult): void {
  if (process.env.NODE_ENV === "production" || result.allowed) {
    return;
  }

  const divider = "-".repeat(60);

  console.log(`\n${divider}`);
  console.log("Guardrails — Request Blocked");
  console.log(divider);
  console.log("Layer:", result.layer);
  console.log("Message:", result.message);
  console.log("Reasons:", result.reasons.join(" | "));
  console.log(`${divider}\n`);
}

export function runGuardrails(input: string): GuardrailResult {
  const inputResult = validateInput(input);

  if (!inputResult.allowed) {
    logGuardrailRejection(inputResult);
    return inputResult;
  }

  const businessResult = validateBusinessRules(input);

  if (!businessResult.allowed) {
    logGuardrailRejection(businessResult);
    return businessResult;
  }

  const injectionResult = detectPromptInjection(input);

  if (!injectionResult.allowed) {
    logGuardrailRejection(injectionResult);
    return injectionResult;
  }

  return { allowed: true };
}
