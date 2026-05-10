import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding/profile");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Hyperion Team
          </span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl">{children}</div>
      </main>
    </div>
  );
}
