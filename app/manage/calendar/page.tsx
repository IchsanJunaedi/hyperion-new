import { Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TEAM_COLORS = [
  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "bg-green-500/20 text-green-300 border-green-500/30",
  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "bg-pink-500/20 text-pink-300 border-pink-500/30",
];

interface Props {
  searchParams: Promise<{ month?: string; year?: string }>;
}

const ManageCalendarPage = async ({ searchParams }: Props) => {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/manage/calendar");

  const now = new Date();
  const year = sp.year ? parseInt(sp.year) : now.getFullYear();
  const month = sp.month ? parseInt(sp.month) : now.getMonth() + 1;
  const targetDate = new Date(year, month - 1, 1);

  const admin = createAdminClient();

  const { data: memberships } = await admin
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("role", "manager")
    .eq("is_active", true)
    .limit(20);

  const orgIds = [
    ...new Set((memberships ?? []).map((m) => m.organization_id)),
  ];

  if (orgIds.length === 0) {
    return (
      <div className="text-center py-20 text-[#9B9A97] text-sm">
        Kamu belum di-assign ke tim manapun.
      </div>
    );
  }

  const [orgsRes, eventsRes] = await Promise.all([
    admin
      .from("organizations")
      .select("id, slug, name")
      .in("id", orgIds)
      .limit(20),
    admin
      .from("calendar_events")
      .select("id, title, starts_at, ends_at, event_type, organization_id")
      .in("organization_id", orgIds)
      .gte("starts_at", startOfMonth(targetDate).toISOString())
      .lte("starts_at", endOfMonth(targetDate).toISOString())
      .order("starts_at", { ascending: true })
      .limit(200),
  ]);

  if (orgsRes.error) console.error("[manage/calendar] orgs:", orgsRes.error);
  if (eventsRes.error) console.error("[manage/calendar] events:", eventsRes.error);

  const orgs = orgsRes.data ?? [];
  const events = eventsRes.data ?? [];

  const orgMap = new Map(
    orgs.map((o, i) => [
      o.id,
      { ...o, colorClass: TEAM_COLORS[i % TEAM_COLORS.length] },
    ])
  );

  const prevMonth = addMonths(targetDate, -1);
  const nextMonth = addMonths(targetDate, 1);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-400" />
          <h1 className="text-xl font-bold text-[#E5E2E1]">
            Kalender Semua Tim
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/manage/calendar?year=${prevMonth.getFullYear()}&month=${prevMonth.getMonth() + 1}`}
            className="rounded px-3 py-1.5 text-[#9B9A97] hover:bg-[#2C2C2C] hover:text-[#D4D4D4] transition"
          >
            ← Prev
          </Link>
          <span className="font-medium text-[#D4D4D4] min-w-[120px] text-center">
            {format(targetDate, "MMMM yyyy", { locale: localeId })}
          </span>
          <Link
            href={`/manage/calendar?year=${nextMonth.getFullYear()}&month=${nextMonth.getMonth() + 1}`}
            className="rounded px-3 py-1.5 text-[#9B9A97] hover:bg-[#2C2C2C] hover:text-[#D4D4D4] transition"
          >
            Next →
          </Link>
        </div>
      </header>

      {/* Team legend */}
      <div className="flex flex-wrap gap-2">
        {orgs.map((org, i) => (
          <span
            key={org.id}
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${TEAM_COLORS[i % TEAM_COLORS.length]}`}
          >
            {org.name}
          </span>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-[#2D2D2D] bg-[#202020] py-12 text-center text-sm text-[#6B6A68]">
          Tidak ada event di bulan ini.
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => {
            const org = orgMap.get(event.organization_id);
            return (
              <div
                key={event.id}
                className="flex items-center gap-4 rounded-lg border border-[#2D2D2D] bg-[#202020] px-4 py-3"
              >
                <div className="w-16 shrink-0 text-center">
                  <p className="text-lg font-bold text-[#D4D4D4]">
                    {format(new Date(event.starts_at), "d")}
                  </p>
                  <p className="text-[10px] uppercase text-[#6B6A68]">
                    {format(new Date(event.starts_at), "EEE", { locale: localeId })}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[#E5E2E1]">
                    {event.title}
                  </p>
                  <p className="text-xs text-[#9B9A97]">
                    {format(new Date(event.starts_at), "HH:mm")}
                    {event.ends_at &&
                      ` – ${format(new Date(event.ends_at), "HH:mm")}`}
                  </p>
                </div>
                {org && (
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${org.colorClass}`}
                  >
                    {org.name}
                  </span>
                )}
                {org && (
                  <Link
                    href={`/${org.slug}/calendar/${event.id}`}
                    className="shrink-0 text-xs text-[#9B9A97] hover:text-[#D4D4D4] transition"
                  >
                    Detail →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default ManageCalendarPage;
