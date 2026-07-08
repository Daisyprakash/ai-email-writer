import { NextResponse } from "next/server";

import { generateEmail } from "@/lib/openai";
import type { GenerateEmailErrorResponse, GenerateEmailResponse } from "@/types/email";
import { validateGenerateEmailRequest } from "@/utils/validation";

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json<GenerateEmailErrorResponse>(
        { error: "OpenAI API key is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const validation = validateGenerateEmailRequest(body);

    if (!validation.success) {
      return NextResponse.json<GenerateEmailErrorResponse>(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { prompt, tone, length, additionalInstructions } = validation.data;

    const generatedEmail = await generateEmail(
      prompt,
      tone,
      length,
      additionalInstructions
    );

    return NextResponse.json<GenerateEmailResponse>({ generatedEmail });
  } catch (error) {
    console.error("Email generation failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while generating your email.";

    const isNetworkError =
      message.toLowerCase().includes("fetch") ||
      message.toLowerCase().includes("network") ||
      message.toLowerCase().includes("connection");

    return NextResponse.json<GenerateEmailErrorResponse>(
      {
        error: isNetworkError
          ? "Network error. Please check your connection and try again."
          : "Failed to generate email. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
