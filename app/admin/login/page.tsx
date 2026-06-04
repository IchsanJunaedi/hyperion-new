import { redirect } from "next/navigation";
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
    <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D]">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#F5C400]">
            Hyperion Admin
          </p>
          <h1 className="mt-2 text-2xl font-black uppercase tracking-tight text-white">
            Masuk
          </h1>
        </div>
        <AdminLoginForm action={adminSignInAction} />
      </div>
    </div>
  );
}
