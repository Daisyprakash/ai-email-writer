import Link from "next/link";
import { ArrowRight, Mail, Sparkles, Shield } from "lucide-react";

import { MarketingNavbar } from "@/components/Navigation/Navbar";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <>
      <MarketingNavbar />

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-24 left-1/2 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
          </div>

          <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 py-20 text-center sm:px-6 sm:py-28">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Mail className="size-8" aria-hidden="true" />
            </div>

            <div className="max-w-3xl space-y-6">
              <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Write professional emails with AI
              </h1>
              <p className="text-lg text-muted-foreground sm:text-xl">
                Describe what you need, choose your tone and length, and get a
                polished email in seconds. Built for individuals and teams who
                want to communicate better, faster.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="gap-2"
                nativeButton={false}
                render={<Link href="/signup" />}
              >
                Get Started
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="/login" />}
              >
                Login
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3 sm:px-6">
            <div className="space-y-3 rounded-xl border bg-card p-6 shadow-sm">
              <Sparkles className="size-6 text-primary" aria-hidden="true" />
              <h2 className="font-medium">AI-powered writing</h2>
              <p className="text-sm text-muted-foreground">
                Generate emails tailored to your tone, length, and context in
                one click.
              </p>
            </div>
            <div className="space-y-3 rounded-xl border bg-card p-6 shadow-sm">
              <Shield className="size-6 text-primary" aria-hidden="true" />
              <h2 className="font-medium">Secure by design</h2>
              <p className="text-sm text-muted-foreground">
                Your account is protected with authentication and secure
                sessions.
              </p>
            </div>
            <div className="space-y-3 rounded-xl border bg-card p-6 shadow-sm">
              <Mail className="size-6 text-primary" aria-hidden="true" />
              <h2 className="font-medium">Ready when you are</h2>
              <p className="text-sm text-muted-foreground">
                Copy, regenerate, or clear — everything you need in one simple
                workspace.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
