import { timingSafeEqual } from "crypto";

export function comparePasswordHashes(stored: string, provided: string): boolean {
  if (stored.length !== provided.length) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(stored, "utf8"),
    Buffer.from(provided, "utf8")
  );
}
