export const LOGIN_ERROR_CODES = {
  USER_NOT_FOUND: "user_not_found",
  INVALID_PASSWORD: "invalid_password",
} as const;

export type LoginErrorCode =
  (typeof LOGIN_ERROR_CODES)[keyof typeof LOGIN_ERROR_CODES];

export const LOGIN_FALLBACK_MESSAGE = "Unable to sign in. Please try again.";

export const LOGIN_ERROR_MESSAGES: Record<LoginErrorCode, string> = {
  [LOGIN_ERROR_CODES.USER_NOT_FOUND]:
    "No account found with this email. Please sign up first.",
  [LOGIN_ERROR_CODES.INVALID_PASSWORD]:
    "Incorrect password. Please try again.",
};

export function isLoginErrorCode(code: string): code is LoginErrorCode {
  return code in LOGIN_ERROR_MESSAGES;
}

export function getLoginErrorMessage(code?: string | null): string {
  if (code && isLoginErrorCode(code)) {
    return LOGIN_ERROR_MESSAGES[code];
  }

  return LOGIN_FALLBACK_MESSAGE;
}
