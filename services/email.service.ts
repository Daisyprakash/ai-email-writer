import Email, { type IEmail } from "@/models/Email";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import type {
  EmailLength,
  EmailTone,
  SavedEmail,
  SavedEmailSummary,
} from "@/types/email";

function toSavedEmail(email: IEmail): SavedEmail {
  return {
    id: email._id.toString(),
    userId: email.userId.toString(),
    prompt: email.prompt,
    tone: email.tone as EmailTone,
    length: email.emailLength as EmailLength,
    additionalInstructions: email.additionalInstructions || undefined,
    generatedEmail: email.generatedEmail,
    createdAt: email.createdAt.toISOString(),
    updatedAt: email.updatedAt.toISOString(),
  };
}

function toSavedEmailSummary(email: IEmail): SavedEmailSummary {
  return {
    id: email._id.toString(),
    prompt: email.prompt,
    generatedEmail: email.generatedEmail,
    tone: email.tone as EmailTone,
    length: email.emailLength as EmailLength,
    createdAt: email.createdAt.toISOString(),
  };
}

export async function createSavedEmail({
  userId,
  prompt,
  tone,
  length,
  additionalInstructions,
  generatedEmail,
}: {
  userId: string;
  prompt: string;
  tone: EmailTone;
  length: EmailLength;
  additionalInstructions?: string;
  generatedEmail: string;
}): Promise<SavedEmail> {
  await connectDB();

  const email = await Email.create({
    userId,
    prompt: prompt.trim(),
    tone,
    emailLength: length,
    additionalInstructions: additionalInstructions?.trim() ?? "",
    generatedEmail,
  });

  return toSavedEmail(email);
}

export async function getSavedEmailsByUserId(
  userId: string
): Promise<SavedEmailSummary[]> {
  await connectDB();

  const emails = await Email.find({ userId })
    .sort({ createdAt: -1 })
    .select("prompt generatedEmail tone emailLength createdAt");

  return emails.map(toSavedEmailSummary);
}

export async function searchSavedEmailsByUserId(
  userId: string,
  query: string
): Promise<SavedEmailSummary[]> {
  await connectDB();

  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return getSavedEmailsByUserId(userId);
  }

  const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedQuery, "i");

  const emails = await Email.find({
    userId,
    $or: [{ prompt: regex }, { generatedEmail: regex }],
  })
    .sort({ createdAt: -1 })
    .select("prompt generatedEmail tone emailLength createdAt");

  return emails.map(toSavedEmailSummary);
}

export async function getSavedEmailById(
  userId: string,
  emailId: string
): Promise<SavedEmail | null> {
  if (!mongoose.isValidObjectId(emailId)) {
    return null;
  }

  await connectDB();

  const email = await Email.findOne({ _id: emailId, userId });
  return email ? toSavedEmail(email) : null;
}

export async function deleteSavedEmailById(
  userId: string,
  emailId: string
): Promise<boolean> {
  if (!mongoose.isValidObjectId(emailId)) {
    return false;
  }

  await connectDB();

  const result = await Email.deleteOne({ _id: emailId, userId });
  return result.deletedCount === 1;
}
