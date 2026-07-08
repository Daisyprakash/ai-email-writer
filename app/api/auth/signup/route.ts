import { NextResponse } from "next/server";

import { createCredentialsUser } from "@/services/user.service";
import { isSha256Hash } from "@/utils/password";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body as Record<string, unknown>;

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (typeof password !== "string" || !isSha256Hash(password)) {
      return NextResponse.json(
        { error: "Invalid password format." },
        { status: 400 }
      );
    }

    const user = await createCredentialsUser({
      name,
      email,
      passwordHash: password,
    });

    return NextResponse.json(
      { message: "Account created successfully.", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to create account. Please try again.";

    const isDuplicate = message.toLowerCase().includes("already exists");
    const isDatabaseError =
      message.includes("MONGODB_URI") ||
      message.toLowerCase().includes("connect");

    if (isDuplicate) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    if (isDatabaseError) {
      return NextResponse.json(
        { error: "Database connection failed. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
