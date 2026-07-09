import NextAuth, { CredentialsSignin, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/lib/auth.config";
import { LoginError } from "@/services/user.service";
import { LOGIN_ERROR_CODES } from "@/utils/login-errors";

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email;
      const password = credentials?.password;

      if (typeof email !== "string" || typeof password !== "string") {
        return null;
      }

      try {
        const { validateCredentialsUser } = await import(
          "@/services/user.service"
        );
        const user = await validateCredentialsUser(email, password);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      } catch (error) {
        if (error instanceof LoginError) {
          const signInError = new CredentialsSignin();
          signInError.code =
            error.code === "USER_NOT_FOUND"
              ? LOGIN_ERROR_CODES.USER_NOT_FOUND
              : LOGIN_ERROR_CODES.INVALID_PASSWORD;
          throw signInError;
        }

        console.error("Login failed:", error);
        return null;
      }
    },
  }),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
});
