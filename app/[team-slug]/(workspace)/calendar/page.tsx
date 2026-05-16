import { Plus } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CalendarWithQuickAdd } from "@/features/calendar/components/CalendarWithQuickAdd";
import { listUnifiedCalendarEvents } from "@/features/calendar/unified";
import { getOrgBySlug } from "@/features/teams/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface CalendarPageProps {
  params: Promise<{ "team-slug": string }>;
  searchParams: Promise<{ y?: string; m?: string }>;
}

export default async function CalendarPage({
  params,
  searchParams,
}: CalendarPageProps) {
  const [{ "team-slug": slug }, sp] = await Promise.all([params, searchParams]);
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/${slug}/calendar`);

  // Get user role in this org
  const { data: member } = await supabase
    .from("team_members")
    .select("role")
    .eq("organization_id", organization.id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwner = ownerEmail && user.email === ownerEmail;
  const role = member?.role ?? null;

  // captain, manager, owner can create events
  const canCreate = isOwner || role === "captain" || role === "manager";

  const now = new Date();
  const year = sp.y ? parseInt(sp.y, 10) : now.getFullYear();
  const month = sp.m ? parseInt(sp.m, 10) : now.getMonth(); // 0-indexed

  // Compute WIB-aware month boundaries for the query
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  const startUtcMs = Date.UTC(year, month, 1) - WIB_OFFSET_MS;
  const endUtcMs = Date.UTC(year, month + 1, 0, 23, 59, 59) - WIB_OFFSET_MS;
  const from = new Date(startUtcMs).toISOString();
  const to = new Date(endUtcMs).toISOString();

  const events = await listUnifiedCalendarEvents(organization.id, from, to);

  // Get divisions for the quick-add modal dropdown
  const { data: divisions } = await supabase
    .from("divisions")
    .select("id, name")
    .eq("organization_id", organization.id)
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/55">
            Calendar
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Kalender Tim
          </h1>
        </div>
        {canCreate && (
          <Link
            href={`/${slug}/calendar/new`}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300"
          >
            <Plus className="h-4 w-4" />
            Tambah event
          </Link>
        )}
      </header>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 sm:p-6">
        <CalendarWithQuickAdd
          orgSlug={slug}
          events={events}
          year={year}
          month={month}
          divisions={divisions ?? []}
          canCreate={canCreate}
        />
      </div>

      {!canCreate && (
        <p className="text-center text-xs text-white/30">
          Hanya captain atau manager yang dapat menambah event
        </p>
      )}
    </div>
  );
}
