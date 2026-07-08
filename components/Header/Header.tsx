import { Mail } from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  return (
    <header className="animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Mail className="size-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              AI Email Writer
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Describe what you need, pick a tone and length, and get a polished
              email in seconds.
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
