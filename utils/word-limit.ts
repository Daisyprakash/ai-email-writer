export function countWords(text: string): number {
  const trimmed = text.trim();

  if (!trimmed) {
    return 0;
  }

  return trimmed.split(/\s+/).length;
}

export function exceedsWordLimit(text: string, maxWords: number): boolean {
  return countWords(text) > maxWords;
}
