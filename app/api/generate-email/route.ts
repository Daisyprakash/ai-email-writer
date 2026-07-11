import { NextResponse } from "next/server";

import {
  buildGuardrailInput,
  runGuardrails,
} from "@/lib/ai/guardrails/guardrail-service";
import { NO_VALID_REQUEST_MESSAGE } from "@/lib/ai/prompts/prompt-templates/constants";
import {
  EmailOutputValidationError,
  streamGenerateEmail,
} from "@/lib/ai/openai.service";
import { OUTPUT_VALIDATION_FAILED_DISPLAY_MESSAGE } from "@/lib/ai/output-validation/email-output.schema";
import { auth } from "@/lib/auth";
import { createSavedEmail } from "@/services/email.service";
import {
  assertCanGenerate,
  incrementDailyUsage,
} from "@/services/plan.service";
import type {
  GenerateEmailErrorResponse,
  GenerateEmailResponse,
  GenerateEmailStreamEvent,
} from "@/types/email";
import { validateGenerateEmailRequest } from "@/utils/validation";

function encodeStreamEvent(event: GenerateEmailStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

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

    const guardrailResult = runGuardrails(
      buildGuardrailInput(prompt, additionalInstructions)
    );

    if (!guardrailResult.allowed) {
      return NextResponse.json<GenerateEmailResponse>({
        generatedEmail: NO_VALID_REQUEST_MESSAGE,
        saved: false,
        usage: usageResult.usage,
        blocked: true,
        blockReason: guardrailResult.message,
      });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: GenerateEmailStreamEvent) => {
          controller.enqueue(encodeStreamEvent(event));
        };

        try {
          let generatedEmail = "";

          for await (const event of streamGenerateEmail(
            prompt,
            tone,
            length,
            additionalInstructions
          )) {
            if (event.type === "delta") {
              send({ type: "delta", preview: event.preview });
              continue;
            }

            generatedEmail = event.email;
          }

          if (generatedEmail.trim() === NO_VALID_REQUEST_MESSAGE) {
            send({
              type: "complete",
              generatedEmail: NO_VALID_REQUEST_MESSAGE,
              saved: false,
              usage: usageResult.usage,
              blocked: true,
              blockReason: NO_VALID_REQUEST_MESSAGE,
            });
            controller.close();
            return;
          }

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

          send({
            type: "complete",
            generatedEmail,
            saved,
            usage: await incrementDailyUsage(session.user.id),
          });
          controller.close();
        } catch (error) {
          if (error instanceof EmailOutputValidationError) {
            send({
              type: "complete",
              generatedEmail: "",
              saved: false,
              usage: usageResult.usage,
              blocked: true,
              blockCode: "OUTPUT_VALIDATION_FAILED",
              blockReason: OUTPUT_VALIDATION_FAILED_DISPLAY_MESSAGE,
            });
            controller.close();
            return;
          }

          const message =
            error instanceof Error
              ? error.message
              : "Something went wrong while generating your email.";

          const isNetworkError =
            message.toLowerCase().includes("fetch") ||
            message.toLowerCase().includes("network") ||
            message.toLowerCase().includes("connection");

          send({
            type: "error",
            error: isNetworkError
              ? "Network error. Please check your connection and try again."
              : message,
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
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
