import { LENGTH_GUIDANCE } from "@/lib/ai/prompts/prompt-templates/constants";
import type { EmailLength, EmailTone } from "@/types/email";

export function buildWritingRules(tone: EmailTone, length: EmailLength): string {
  return `WRITING RULES

- Use a ${tone.toLowerCase()} tone throughout
- ${LENGTH_GUIDANCE[length]}
- Include an appropriate greeting in the body
- Include an appropriate closing and sign-off in the signature
- Use proper paragraph breaks for readability
- Avoid unnecessary repetition or filler
- Use professional, clear language`;
}
