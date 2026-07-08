import { SignupForm } from "@/components/auth/SignupForm";
import { AuthNavbar } from "@/components/Navigation/Navbar";

export default function SignupPage() {
  return (
    <>
      <AuthNavbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <SignupForm />
      </main>
    </>
  );
}
