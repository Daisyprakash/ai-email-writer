import OpenAI from "openai";

import {
  buildSystemPrompt,
  buildUserPrompt,
} from "@/lib/ai/prompts/prompt-builder";
import { NO_VALID_REQUEST_MESSAGE } from "@/lib/ai/prompts/prompt-templates/constants";
import {
  buildEmailOutputJsonSchema,
  formatEmailForDisplay,
  OUTPUT_VALIDATION_FAILED_MESSAGE,
  parseEmailOutputJson,
} from "@/lib/ai/output-validation/email-output.schema";
import { validateEmailOutput } from "@/lib/ai/output-validation/output-validator";
import type { EmailLength, EmailTone } from "@/types/email";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key is not configured.");
  }

  return new OpenAI({ apiKey });
}

export class EmailOutputValidationError extends Error {
  constructor(message = OUTPUT_VALIDATION_FAILED_MESSAGE) {
    super(message);
    this.name = "EmailOutputValidationError";
  }
}

function logOpenAIRequest({
  model,
  temperature,
  maxTokens,
  tone,
  length,
  messages,
}: {
  model: string;
  temperature: number;
  maxTokens: number;
  tone: EmailTone;
  length: EmailLength;
  messages: Array<{ role: "system" | "user"; content: string }>;
}) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const divider = "=".repeat(60);

  console.log(`\n${divider}`);
  console.log("OpenAI Chat Completion — Request");
  console.log(divider);
  console.log("Model:", model);
  console.log("Temperature:", temperature);
  console.log("Max tokens:", maxTokens);
  console.log("Tone:", tone);
  console.log("Length:", length);
  console.log("-".repeat(60));

  for (const message of messages) {
    console.log(`\n[${message.role.toUpperCase()} MESSAGE]`);
    console.log(message.content);
  }

  console.log(`\n${divider}\n`);
}

function logOpenAIResponse(
  content: string,
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  }
) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const divider = "-".repeat(60);

  console.log(divider);
  console.log("OpenAI Chat Completion — Response");
  console.log(divider);

  if (usage) {
    console.log(
      `Tokens — prompt: ${usage.prompt_tokens ?? 0}, completion: ${usage.completion_tokens ?? 0}, total: ${usage.total_tokens ?? 0}`
    );
    console.log(divider);
  }

  console.log("\n[ASSISTANT MESSAGE]");
  console.log(content);
  console.log(`\n${"=".repeat(60)}\n`);
}

function logOutputValidationFailure(errors: string[]): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.log("-".repeat(60));
  console.log("Output Validation — Failed");
  console.log("Errors:", errors.join(" | "));
  console.log("-".repeat(60));
}

export async function generateEmail(
  prompt: string,
  tone: EmailTone,
  length: EmailLength,
  additionalInstructions?: string
): Promise<string> {
  const openai = getOpenAIClient();
  const model = "gpt-4o-mini";
  const temperature = 0.6;
  const maxTokens = 1024;

  const messages = [
    {
      role: "system" as const,
      content: buildSystemPrompt(tone, length),
    },
    {
      role: "user" as const,
      content: buildUserPrompt(prompt, additionalInstructions),
    },
  ];

  logOpenAIRequest({
    model,
    temperature,
    maxTokens,
    tone,
    length,
    messages,
  });

  const completion = await openai.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "email_output",
        strict: true,
        schema: buildEmailOutputJsonSchema(),
      },
    },
  });

  const raw = completion.choices[0]?.message?.content?.trim();

  if (!raw) {
    throw new Error("The AI did not return an email. Please try again.");
  }

  logOpenAIResponse(raw, completion.usage);

  const parsed = parseEmailOutputJson(raw);

  if (!parsed.success) {
    logOutputValidationFailure(["Response is not valid JSON."]);
    throw new EmailOutputValidationError();
  }

  if (parsed.record.invalidRequest === true) {
    const message = parsed.record.message;

    if (typeof message === "string" && message.trim() === NO_VALID_REQUEST_MESSAGE) {
      return NO_VALID_REQUEST_MESSAGE;
    }
  }

  const validation = validateEmailOutput(parsed.record);

  if (!validation.valid) {
    logOutputValidationFailure(validation.errors);
    throw new EmailOutputValidationError();
  }

  return formatEmailForDisplay(validation.email);
}
