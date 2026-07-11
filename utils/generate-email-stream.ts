import type { GenerateEmailStreamEvent } from "@/types/email";

export async function consumeGenerateEmailStream(
  response: Response,
  onDelta: (preview: string) => void
): Promise<
  Extract<GenerateEmailStreamEvent, { type: "complete" | "error" }>
> {
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("No response stream available.");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      const event = JSON.parse(line) as GenerateEmailStreamEvent;

      if (event.type === "delta") {
        onDelta(event.preview);
        continue;
      }

      if (event.type === "complete" || event.type === "error") {
        return event;
      }
    }
  }

  throw new Error("The response stream ended before the email was completed.");
}
