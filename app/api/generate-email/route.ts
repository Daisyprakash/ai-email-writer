import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { generateEmail } from "@/lib/openai";
import { createSavedEmail } from "@/services/email.service";
import { assertCanGenerate, incrementDailyUsage } from "@/services/plan.service";
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

    const usageResult = await assertCanGenerate(session.user.id);

    if (!usageResult.allowed) {
      const upgradePlan = usageResult.usage.upgradePlan;
      const message = usageResult.canUpgrade && upgradePlan
        ? `You have reached your daily limit on the ${usageResult.usage.currentPlan.name} plan. Upgrade to ${upgradePlan.name} to generate more emails.`
        : "You have reached your daily generation limit. Please try again after the usage resets.";

      return NextResponse.json<GenerateEmailErrorResponse>(
        {
          error: message,
          code: "USAGE_LIMIT_REACHED",
          canUpgrade: usageResult.canUpgrade,
          usage: usageResult.usage,
        },
        { status: 429 }
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

    return NextResponse.json<GenerateEmailResponse>({
      generatedEmail,
      saved,
      usage: await incrementDailyUsage(session.user.id),
    });
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
