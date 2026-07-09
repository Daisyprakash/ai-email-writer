import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  deleteSavedEmailById,
  getSavedEmailById,
} from "@/services/email.service";
import type {
  EmailDeleteResponse,
  EmailDetailResponse,
  EmailErrorResponse,
} from "@/types/email";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<EmailErrorResponse>(
        { error: "Unauthorized. Please sign in to view this email." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const email = await getSavedEmailById(session.user.id, id);

    if (!email) {
      return NextResponse.json<EmailErrorResponse>(
        { error: "Email not found." },
        { status: 404 }
      );
    }

    return NextResponse.json<EmailDetailResponse>({ email });
  } catch (error) {
    console.error("Failed to fetch email:", error);

    return NextResponse.json<EmailErrorResponse>(
      { error: "Unable to load this email. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<EmailErrorResponse>(
        { error: "Unauthorized. Please sign in to delete emails." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const deleted = await deleteSavedEmailById(session.user.id, id);

    if (!deleted) {
      return NextResponse.json<EmailErrorResponse>(
        { error: "Email not found." },
        { status: 404 }
      );
    }

    return NextResponse.json<EmailDeleteResponse>({
      message: "Email deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete email:", error);

    return NextResponse.json<EmailErrorResponse>(
      { error: "Unable to delete this email. Please try again." },
      { status: 500 }
    );
  }
}
