const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/i;

export function isSha256Hash(value: string): boolean {
  return SHA256_HEX_REGEX.test(value);
}
