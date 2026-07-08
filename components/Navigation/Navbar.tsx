"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut, Mail } from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const protectedLinks = [
  { href: "/app", label: "Email Writer" },
  { href: "/profile", label: "Profile" },
];

export function ProtectedNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/app" className="flex items-center gap-2 font-medium">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Mail className="size-4" aria-hidden="true" />
            </div>
            <span className="hidden sm:inline">AI Email Writer</span>
          </Link>

          <nav className="flex items-center gap-1">
            {protectedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  pathname === link.href
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {session?.user?.name && (
            <span className="hidden text-sm text-muted-foreground md:inline">
              {session.user.name}
            </span>
          )}
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function MarketingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-medium">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Mail className="size-4" aria-hidden="true" />
          </div>
          <span>AI Email Writer</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            Login
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/signup" />}>
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
}

export function AuthNavbar() {
  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-medium">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Mail className="size-4" aria-hidden="true" />
          </div>
          <span>AI Email Writer</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
