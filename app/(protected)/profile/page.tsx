import { redirect } from "next/navigation";
import { User } from "lucide-react";

import { auth } from "@/lib/auth";
import { getUserProfileById } from "@/services/user.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(new Date(dateString));
}

function formatProvider(provider: string) {
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getUserProfileById(session.user.id);

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Profile
        </h1>
        <p className="text-muted-foreground">
          Your account information and authentication details.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>
            This information is tied to your authenticated session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            {profile.image ? (
              <img
                src={profile.image}
                alt={profile.name}
                className="size-20 rounded-full border object-cover"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full border bg-muted">
                <User className="size-8 text-muted-foreground" aria-hidden="true" />
              </div>
            )}
            <div>
              <p className="text-xl font-medium">{profile.name}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Authentication Provider</p>
              <p className="mt-1 font-medium">{formatProvider(profile.provider)}</p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Account Created</p>
              <p className="mt-1 font-medium">{formatDate(profile.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
