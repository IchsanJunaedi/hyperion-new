import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

const ACTION_COLORS: Record<string, string> = {
  org_updated: "text-blue-400",
  division_archived: "text-amber-400",
  division_deleted: "text-red-400",
  member_removed: "text-red-400",
  role_changed: "text-purple-400",
  member_added: "text-green-400",
  scrim_created: "text-blue-400",
  announcement_created: "text-blue-400",
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
    .limit(100);

  // Get actor profiles
  const actorIds = [...new Set((logs ?? []).map((l) => l.actor_id).filter(Boolean))] as string[];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, username")
    .in("id", actorIds.length > 0 ? actorIds : ["__none__"]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <>
      <header className="border-b border-white/5">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs text-white/50 hover:text-white">← Dashboard</Link>
            <span className="text-sm font-bold text-yellow-400">Audit Log</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="mt-1 text-sm text-white/60">
            Riwayat semua aktivitas penting: perubahan role, update tim, hapus divisi, dll.
          </p>
        </header>

        {(!logs || logs.length === 0) ? (
          <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/40">
            Belum ada aktivitas tercatat.
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const actor = log.actor_id ? profileMap.get(log.actor_id) : null;
              const actorName = actor?.display_name ?? actor?.username ?? "System";
              const actionLabel = ACTION_LABELS[log.action] ?? log.action;
              const actionColor = ACTION_COLORS[log.action] ?? "text-white/60";
              const meta = log.metadata as Record<string, unknown> | null;
              const time = new Date(log.created_at).toLocaleString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Jakarta",
              });

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${actionColor}`}>
                        {actionLabel}
                      </span>
                      <span className="text-xs text-white/30">oleh</span>
                      <span className="text-xs font-medium text-white/70">{actorName}</span>
                    </div>
                    {meta && Object.keys(meta).length > 0 && (
                      <p className="mt-0.5 text-xs text-white/40 truncate">
                        {JSON.stringify(meta)}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-white/30">{time}</span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
