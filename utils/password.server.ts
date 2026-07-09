import { createHash, timingSafeEqual } from "crypto";

export function hashPasswordServer(password: string): string {
  return createHash("sha256").update(password, "utf8").digest("hex");
}

export function comparePasswordHashes(stored: string, provided: string): boolean {
  if (stored.length !== provided.length) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(stored, "utf8"),
    Buffer.from(provided, "utf8")
  );
}
