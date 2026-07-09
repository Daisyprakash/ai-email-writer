import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  createSavedEmail,
  getSavedEmailsByUserId,
  searchSavedEmailsByUserId,
} from "@/services/email.service";
import type {
  EmailErrorResponse,
  EmailListResponse,
  SavedEmail,
} from "@/types/email";
import { validateSaveEmailRequest } from "@/utils/validation";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<EmailErrorResponse>(
        { error: "Unauthorized. Please sign in to view your emails." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";

    const emails = search
      ? await searchSavedEmailsByUserId(session.user.id, search)
      : await getSavedEmailsByUserId(session.user.id);

    return NextResponse.json<EmailListResponse>({ emails });
  } catch (error) {
    console.error("Failed to fetch email history:", error);

    return NextResponse.json<EmailErrorResponse>(
      { error: "Unable to load your email history. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<EmailErrorResponse>(
        { error: "Unauthorized. Please sign in to save emails." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = validateSaveEmailRequest(body);

    if (!validation.success) {
      return NextResponse.json<EmailErrorResponse>(
        { error: validation.error },
        { status: 400 }
      );
    }

    const email = await createSavedEmail({
      userId: session.user.id,
      ...validation.data,
    });

    return NextResponse.json<{ email: SavedEmail }>({ email }, { status: 201 });
  } catch (error) {
    console.error("Failed to save email:", error);

    return NextResponse.json<EmailErrorResponse>(
      { error: "Unable to save your email. Please try again." },
      { status: 500 }
    );
  }
}
