import { redirect } from "next/navigation";
import { Crown } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { adminSignInAction } from "./actions";
import { AdminLoginForm } from "@/features/admin/components/AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const adminEmail = process.env.ADMIN_EMAIL;
    const ownerEmail = process.env.OWNER_EMAIL;
    if (user.email === adminEmail || user.email === ownerEmail) {
      redirect("/admin");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 bg-ui-bg">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Crown className="h-12 w-12 mx-auto text-ui-text-2 mb-4" />
          <h1 className="text-2xl font-bold text-ui-text">Hyperion Admin</h1>
          <p className="mt-1 text-sm text-ui-text-2">Login untuk mengakses panel admin.</p>
        </div>
        <AdminLoginForm action={adminSignInAction} />
      </div>
    </main>
  );
}
