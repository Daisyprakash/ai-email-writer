/**
 * Guardrail Step 2 — Business Validation
 *
 * Runs second inside `runGuardrails()`, after input validation passes.
 * This is product-scope validation — not security, not AI.
 *
 * Question answered: "Does this request clearly belong outside an email-writing app?"
 *
 * Input evaluated: the same combined prompt + additional instructions string.
 *
 * Philosophy: reject-only. We do not try to positively identify valid emails here.
 * Unrelated requests are blocked early. Everything else is allowed through to the LLM,
 * which handles ambiguous cases via its own fallback.
 *
 * On rejection: returns BUSINESS_REJECTION_MESSAGE without calling OpenAI.
 */
import {
  BUSINESS_REJECTION_MESSAGE,
  type GuardrailRejection,
  type GuardrailResult,
} from "@/lib/ai/guardrails/validators/security-types";

// Signals that the request belongs outside this application.
const UNRELATED_PATTERNS = [
  /\b(python|javascript|typescript|java|c\+\+|rust|golang|ruby|php)\b/i,
  /\b(palindrome|fibonacci|binary\s+search|algorithm|leetcode)\b/i,
  /\b(function|variable|npm|debug|compile|syntax\s+error)\b/i,
  /\b(center\s+a\s+div|flexbox|css|html\s+element|javascript\s+framework)\b/i,
  /\b(fifa|world\s+cup|who\s+won|trivia|capital\s+of)\b/i,
  /\b(explain\s+what|what\s+is|define\s+|calculate|solve\s+equation)\b/i,
  /\bwrite\s+(a\s+)?(python|javascript|java|code|script|program)\b/i,
  /\b(linux\s+terminal|command\s+line\s+shell)\b/i,
  /\b(chatgpt|gpt-4|openai\s+api)\b/i,
  /\bhow\s+do\s+i\s+(code|program|build|install)\b/i,
];

function hasUnrelatedIntent(text: string): boolean {
  return UNRELATED_PATTERNS.some((pattern) => pattern.test(text));
}

function reject(reasons: string[]): GuardrailRejection {
  return {
    allowed: false,
    layer: "business",
    message: BUSINESS_REJECTION_MESSAGE,
    reasons,
  };
}

export function validateBusinessRules(input: string): GuardrailResult {
  if (hasUnrelatedIntent(input)) {
    return reject(["Input does not appear to be an email-writing request."]);
  }

  return { allowed: true };
}
