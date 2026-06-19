import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { fetchAuditActivity } from "@/features/dashboard/actions/fetchAuditActivity";
import {
  fetchAuditLogs,
  fetchDistinctActors,
} from "@/features/dashboard/actions/fetchAuditLogs";
import { AuditDashboard } from "@/features/dashboard/components/AuditDashboard";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    search?: string;
    module?: string;
    actor?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function DashboardAuditPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (user.email !== ownerEmail) redirect("/");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1"));

  const [{ items, total, pageCount }, activityData7, activityData30, actors] =
    await Promise.all([
      fetchAuditLogs({
        search: params.search,
        entityType: params.module,
        actorId: params.actor,
        from: params.from,
        to: params.to,
        page,
      }),
      fetchAuditActivity(7),
      fetchAuditActivity(30),
      fetchDistinctActors(),
    ]);

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <AuditDashboard
          items={items}
          total={total}
          pageCount={pageCount}
          activityData7={activityData7}
          activityData30={activityData30}
          actors={actors}
          currentFilters={{
            search: params.search ?? "",
            module: params.module ?? "",
            actor: params.actor ?? "",
            from: params.from ?? "",
            to: params.to ?? "",
            page,
          }}
        />
      </main>
    </>
  );
}
