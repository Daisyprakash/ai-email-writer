import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { generateEmail } from "@/lib/openai";
import { createSavedEmail } from "@/services/email.service";
import type { GenerateEmailErrorResponse, GenerateEmailResponse } from "@/types/email";
import { validateGenerateEmailRequest } from "@/utils/validation";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<GenerateEmailErrorResponse>(
        { error: "Unauthorized. Please sign in to generate emails." },
        { status: 401 }
      );
    }

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

    let saved = true;

    try {
      await createSavedEmail({
        userId: session.user.id,
        prompt,
        tone,
        length,
        additionalInstructions,
        generatedEmail,
      });
    } catch (saveError) {
      saved = false;
      console.error("Failed to auto-save generated email:", saveError);
    }

    return NextResponse.json<GenerateEmailResponse>({ generatedEmail, saved });
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

    const isUserFacingError =
      message.includes("couldn't identify a valid email request") ||
      message.includes("did not return an email");

    return NextResponse.json<GenerateEmailErrorResponse>(
      {
        error: isNetworkError
          ? "Network error. Please check your connection and try again."
          : message,
      },
      { status: isUserFacingError ? 400 : 500 }
    );
  }
}
