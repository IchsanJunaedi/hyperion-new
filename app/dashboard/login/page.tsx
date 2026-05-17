import { redirect } from "next/navigation";
import { Crown } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { DashboardLoginForm } from "@/features/dashboard/components/DashboardLoginForm";

export const dynamic = "force-dynamic";

export default async function DashboardLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is already logged in, redirect to dashboard home
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 bg-[#191919]">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Crown className="h-12 w-12 mx-auto text-[#9B9A97] mb-4" />
          <h1 className="text-2xl font-bold text-[#E5E2E1]">Master Dashboard</h1>
          <p className="mt-1 text-sm text-[#9B9A97]">Login untuk mengakses panel admin.</p>
        </div>
        <DashboardLoginForm />
      </div>
    </main>
  );
}
