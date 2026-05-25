import { Plus } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { CalendarWithQuickAdd } from "@/features/calendar/components/CalendarWithQuickAdd";
import { CalendarAgendaView } from "@/features/calendar/components/CalendarAgendaView";
import { CalendarViewToggle } from "@/features/calendar/components/CalendarViewToggle";
import { CalendarWeeklyWarRoom } from "@/features/calendar/components/CalendarWeeklyWarRoom";
import { listUnifiedCalendarEvents } from "@/features/calendar/unified";
import { getOrgBySlug } from "@/features/teams/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface CalendarPageProps {
  params: Promise<{ "team-slug": string }>;
  searchParams: Promise<{ y?: string; m?: string; view?: string }>;
}

export default async function CalendarPage({
  params,
  searchParams,
}: CalendarPageProps) {
  const [{ "team-slug": slug }, sp] = await Promise.all([params, searchParams]);
  const viewMode = sp.view === "list" ? "list" : sp.view === "week" ? "week" : "grid";
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

  // captain, manager, coach, owner can create events
  const canCreate = isOwner || role === "captain" || role === "manager" || role === "coach";

  const now = new Date();
  const year = sp.y ? parseInt(sp.y, 10) : now.getFullYear();
  const month = sp.m ? parseInt(sp.m, 10) : now.getMonth(); // 0-indexed

  // Compute WIB-aware date range for the query
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  let from: string;
  let to: string;
  if (viewMode === "week") {
    // Week view needs ±8 weeks from today to allow navigation
    const fromMs = now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000;
    const toMs = now.getTime() + 8 * 7 * 24 * 60 * 60 * 1000;
    from = new Date(fromMs).toISOString();
    to = new Date(toMs).toISOString();
  } else {
    const startUtcMs = Date.UTC(year, month, 1) - WIB_OFFSET_MS;
    const endUtcMs = Date.UTC(year, month + 1, 0, 23, 59, 59) - WIB_OFFSET_MS;
    from = new Date(startUtcMs).toISOString();
    to = new Date(endUtcMs).toISOString();
  }

  const events = await listUnifiedCalendarEvents(organization.id, from, to, isOwner ? "owner" : role);

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
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Kalender Tim
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Suspense>
            <CalendarViewToggle activeView={viewMode as "grid" | "list" | "week"} />
          </Suspense>
          {canCreate && (
            <Link
              href={`/${slug}/calendar/new`}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300"
            >
              <Plus className="h-4 w-4" />
              Tambah event
            </Link>
          )}
        </div>
      </header>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 sm:p-6">
        {viewMode === "week" ? (
          <CalendarWeeklyWarRoom orgSlug={slug} events={events} />
        ) : viewMode === "list" ? (
          <CalendarAgendaView orgSlug={slug} events={events} />
        ) : (
          <CalendarWithQuickAdd
            orgSlug={slug}
            events={events}
            year={year}
            month={month}
            divisions={divisions ?? []}
            canCreate={canCreate}
            userRole={isOwner ? "owner" : (role ?? "member")}
          />
        )}
      </div>

      {!canCreate && (
        <p className="text-center text-xs text-white/30">
          Hanya captain atau manager yang dapat menambah event
        </p>
      )}
    </div>
  );
}
