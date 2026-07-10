/**
 * Guardrail Step 3 — Prompt Injection Detection
 *
 * Runs last inside `runGuardrails()`, after input and business validation pass.
 * This is AI-specific security — cheap heuristic checks, no LLM call.
 *
 * Question answered: "Is someone trying to manipulate the model or override its role?"
 *
 * Input evaluated: the same combined prompt + additional instructions string.
 *
 * Checks for common injection patterns such as:
 * - Instruction overrides ("ignore previous instructions")
 * - System prompt extraction ("reveal your system prompt")
 * - Role reassignment ("you are now", "act as")
 * - Jailbreak phrases
 *
 * On rejection: returns 400 with a security message. OpenAI is not called.
 * The LLM constraints in Phase 1 remain the final safety net for anything we miss.
 */
import {
  INJECTION_REJECTION_MESSAGE,
  type GuardrailRejection,
  type GuardrailResult,
} from "@/lib/ai/guardrails/validators/security-types";

// Known injection phrases — simple keyword/pattern matching for now.
const INJECTION_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
    reason: "Contains instruction override attempt.",
  },
  {
    pattern: /forget\s+(all\s+)?(previous|prior|above)\s+instructions/i,
    reason: "Contains instruction override attempt.",
  },
  {
    pattern: /disregard\s+(all\s+)?(previous|prior|above)\s+instructions/i,
    reason: "Contains instruction override attempt.",
  },
  {
    pattern: /\bsystem\s+prompt\b/i,
    reason: "Requests system prompt access.",
  },
  {
    pattern: /\breveal\s+(your\s+)?(system\s+)?prompt\b/i,
    reason: "Requests system prompt access.",
  },
  {
    pattern: /\bprint\s+(hidden\s+)?instructions\b/i,
    reason: "Requests hidden instructions.",
  },
  {
    pattern: /\byou\s+are\s+now\b/i,
    reason: "Attempts role reassignment.",
  },
  {
    pattern: /\bact\s+as\b/i,
    reason: "Attempts role reassignment.",
  },
  {
    pattern: /\bdeveloper\s+message\b/i,
    reason: "Attempts to inject developer messages.",
  },
  {
    pattern: /\bassistant\s+message\b/i,
    reason: "Attempts to inject assistant messages.",
  },
  {
    pattern: /\bnew\s+instructions\s*:/i,
    reason: "Attempts to inject new instructions.",
  },
  {
    pattern: /\boverride\s+(your\s+)?instructions\b/i,
    reason: "Contains instruction override attempt.",
  },
  {
    pattern: /\bjailbreak\b/i,
    reason: "Contains jailbreak attempt.",
  },
  {
    pattern: /\bdo\s+anything\s+now\b/i,
    reason: "Contains jailbreak attempt.",
  },
  {
    pattern: /\bdan\s+mode\b/i,
    reason: "Contains jailbreak attempt.",
  },
];

function reject(reasons: string[]): GuardrailRejection {
  return {
    allowed: false,
    layer: "injection",
    message: INJECTION_REJECTION_MESSAGE,
    reasons,
  };
}

export function detectPromptInjection(input: string): GuardrailResult {
  // Collect every matched pattern so dev logs show what was detected.
  const reasons = INJECTION_PATTERNS.filter(({ pattern }) =>
    pattern.test(input)
  ).map(({ reason }) => reason);

  if (reasons.length === 0) {
    return { allowed: true };
  }

  return reject(reasons);
}
