/**
 * Guardrail Step 1 — Input Validation
 *
 * Runs first inside `runGuardrails()` after usage has been confirmed.
 * This is plain data validation — no AI involved.
 *
 * Question answered: "Is the combined user input structurally valid?"
 *
 * Input evaluated: prompt + additional instructions joined as one string.
 *
 * Checks:
 * - Empty or whitespace-only input
 * - No meaningful text (e.g. emoji-only or symbols-only — valid Unicode, but not a describable request)
 * - Excessive length (token/cost protection)
 * - Malformed Unicode or disallowed control characters
 *
 * On rejection: returns 400 with a validation error. OpenAI is not called.
 */
import {
  INPUT_NO_TEXT_MESSAGE,
  MAX_COMBINED_INPUT_CHARS,
  type GuardrailRejection,
  type GuardrailResult,
} from "@/lib/ai/guardrails/validators/security-types";

function hasMeaningfulText(text: string): boolean {
  // Letters or numbers from any language — emoji/symbols alone are not enough.
  return /[\p{L}\p{N}]/u.test(text);
}

function hasInvalidEncoding(text: string): boolean {
  if (text.includes("\0")) {
    return true;
  }

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);

    if (code >= 0xd800 && code <= 0xdbff) {
      const next = text.charCodeAt(index + 1);

      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        return true;
      }
    }

    if (code >= 0xdc00 && code <= 0xdfff) {
      const previous = text.charCodeAt(index - 1);

      if (!(previous >= 0xd800 && previous <= 0xdbff)) {
        return true;
      }
    }

    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      return true;
    }
  }

  return false;
}

function reject(
  message: string,
  reasons: string[]
): GuardrailRejection {
  return {
    allowed: false,
    layer: "input",
    message,
    reasons,
  };
}

export function validateInput(input: string): GuardrailResult {
  // Reject empty requests before any further processing.
  if (!input.trim()) {
    return reject("Please describe the email you want to write.", [
      "Input is empty.",
    ]);
  }

  // Reject emoji-only, symbol-only, or other input with no readable text.
  if (!hasMeaningfulText(input)) {
    return reject(INPUT_NO_TEXT_MESSAGE, [
      "Input contains no letters or numbers.",
    ]);
  }

  // Reject oversized payloads to avoid wasting tokens and API cost.
  if (input.length > MAX_COMBINED_INPUT_CHARS) {
    return reject(
      `Your request is too long. Please keep it under ${MAX_COMBINED_INPUT_CHARS.toLocaleString()} characters.`,
      [`Input exceeds ${MAX_COMBINED_INPUT_CHARS} characters.`]
    );
  }

  // Reject corrupted or unsafe character data.
  if (hasInvalidEncoding(input)) {
    return reject("Your request contains invalid or unsupported characters.", [
      "Input contains malformed encoding or control characters.",
    ]);
  }

  return { allowed: true };
}
