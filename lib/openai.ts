import OpenAI from "openai";

import type { EmailLength, EmailTone } from "@/types/email";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key is not configured.");
  }

  return new OpenAI({ apiKey });
}

const LENGTH_GUIDANCE: Record<EmailLength, string> = {
  Short: "Keep the email brief — about 2–4 sentences total, excluding greeting and closing.",
  Medium:
    "Write a moderate-length email — about 2–3 short paragraphs, excluding greeting and closing.",
  Long: "Write a detailed email — about 4–5 paragraphs with thorough coverage, excluding greeting and closing.",
};

function buildSystemPrompt(tone: EmailTone, length: EmailLength): string {
  return `You are an expert email writer. Write grammatically correct, natural, human-like emails.

Requirements:
- Use a ${tone.toLowerCase()} tone throughout
- ${LENGTH_GUIDANCE[length]}
- Include an appropriate greeting at the start
- Include an appropriate closing and sign-off at the end
- Use proper paragraph breaks for readability
- Avoid unnecessary repetition or filler
- Do not include a subject line unless explicitly requested
- Output only the email body — no explanations, labels, or markdown formatting`;
}

function buildUserPrompt(
  prompt: string,
  additionalInstructions?: string
): string {
  let message = `Write an email based on this description:\n\n${prompt.trim()}`;

  if (additionalInstructions?.trim()) {
    message += `\n\nAdditional instructions:\n${additionalInstructions.trim()}`;
  }

  return message;
}

export async function generateEmail(
  prompt: string,
  tone: EmailTone,
  length: EmailLength,
  additionalInstructions?: string
): Promise<string> {
  const openai = getOpenAIClient();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: buildSystemPrompt(tone, length),
      },
      {
        role: "user",
        content: buildUserPrompt(prompt, additionalInstructions),
      },
    ],
    temperature: 0.8,
    max_tokens: 1024,
  });

  const generatedEmail = completion.choices[0]?.message?.content?.trim();

  if (!generatedEmail) {
    throw new Error("The AI did not return an email. Please try again.");
  }

  return generatedEmail;
}
