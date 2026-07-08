import { Suspense } from "react";

import { LoginForm } from "@/components/auth/LoginForm";
import { AuthNavbar } from "@/components/Navigation/Navbar";

export default function LoginPage() {
  return (
    <>
      <AuthNavbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <Suspense
          fallback={
            <div className="text-sm text-muted-foreground">Loading...</div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>
    </>
  );
}
