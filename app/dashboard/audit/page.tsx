import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AuditLogList,
  type AuditLogItem,
} from "@/features/dashboard/components/AuditLogList";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  org_updated: "Tim diupdate",
  division_archived: "Divisi diarsipkan",
  division_deleted: "Divisi dihapus",
  member_removed: "Member dihapus",
  role_changed: "Role diubah",
  member_added: "Member ditambahkan",
  scrim_created: "Scrim dibuat",
  announcement_created: "Pengumuman dibuat",
};

export default async function DashboardAuditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  const admin = createAdminClient();

  const { data: logs } = await admin
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const actorIds = [
    ...new Set((logs ?? []).map((l) => l.actor_id).filter(Boolean)),
  ] as string[];

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, username")
    .in("id", actorIds.length > 0 ? actorIds : ["__none__"]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const items: AuditLogItem[] = (logs ?? []).map((log) => {
    const actor = log.actor_id ? profileMap.get(log.actor_id) : null;
    const meta = log.metadata as Record<string, unknown> | null;
    return {
      id: log.id,
      action: log.action,
      actionLabel: ACTION_LABELS[log.action] ?? log.action,
      actorName: actor?.display_name ?? actor?.username ?? "System",
      metaText: meta && Object.keys(meta).length > 0 ? JSON.stringify(meta) : "",
      time: new Date(log.created_at).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }),
    };
  });

  return (
    <>
      <header className="h-12 flex items-center px-6 sticky top-0 bg-[#191919] z-40 border-b border-[#2D2D2D]">
        <div className="flex items-center gap-2 text-[#9B9A97] text-sm">
          <Link href="/dashboard" className="hover:text-[#D4D4D4]">
            Home
          </Link>
          <span className="text-[#6B6A68]">/</span>
          <span className="text-[#D4D4D4]">Audit Log</span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <AuditLogList logs={items} />
      </main>
    </>
  );
}
