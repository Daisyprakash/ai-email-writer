export type UserRole = "user" | "admin";

export type AuthProvider = "credentials" | "google";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  provider: AuthProvider;
  role: UserRole;
  createdAt: string;
}
