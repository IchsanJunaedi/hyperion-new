import {
  CalendarDays,
  Megaphone,
  Pin,
  Swords,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

import { ScrimCountdown } from "@/components/team/ScrimCountdown";
import type { TeamHomeData } from "@/features/teams/queries";

export function TeamHome({ data }: { data: TeamHomeData }) {
  const slug = data.organization.slug;

  return (
    <div className="space-y-8 px-4 py-6 sm:px-8">
      {/* Hero */}
      <section className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-wide text-white/55">
          Team Home
        </p>
        <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
          {data.organization.name}
        </h1>
        {data.organization.description ? (
          <p className="mt-2 max-w-2xl text-sm text-white/70 sm:text-base">
            {data.organization.description}
          </p>
        ) : null}
      </section>

      {/* Top row: next scrim + quick stats */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {data.nextScrim ? (
          <ScrimCountdown scrim={data.nextScrim} orgSlug={slug} />
        ) : (
          <article className="rounded-xl border border-dashed border-white/10 bg-zinc-900/30 p-6 text-sm text-white/60">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-white/45">
              <Swords className="h-3.5 w-3.5" />
              Scrim berikutnya
            </div>
            <p>Belum ada scrim terjadwal.</p>
            <Link
              href={`/${slug}/scrim`}
              className="mt-3 inline-flex h-9 items-center rounded-md border border-white/10 px-3 text-sm font-medium text-white transition hover:bg-white/5"
            >
              Buat scrim
            </Link>
          </article>
        )}

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Win rate (30 terakhir)"
            value={
              data.recentWinRate === null
                ? "—"
                : `${Math.round(data.recentWinRate * 100)}%`
            }
          />
          <StatCard
            icon={<CalendarDays className="h-4 w-4" />}
            label="Scrim bulan ini"
            value={data.scrimsThisMonth.toString()}
          />
          <StatCard
            icon={<Users className="h-4 w-4" />}
            label="Anggota aktif"
            value={data.memberCount.toString()}
          />
          <StatCard
            icon={<Megaphone className="h-4 w-4" />}
            label="Divisi"
            value={data.divisions.length.toString()}
          />
        </div>
      </div>

      {/* Pinned announcements */}
      {data.pinnedAnnouncements.length > 0 ? (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Pin className="h-4 w-4 text-yellow-400" />
            Pengumuman penting
          </h2>
          <ul className="space-y-3">
            {data.pinnedAnnouncements.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-yellow-500/15 bg-yellow-500/5 p-4"
              >
                <h3 className="text-base font-semibold text-white">
                  {a.title}
                </h3>
                <p className="mt-1 line-clamp-3 text-sm text-white/75">
                  {a.body}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Activity feed (recent announcements + completed scrims) */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-white">
          Aktivitas terbaru
        </h2>
        {data.recentAnnouncements.length === 0 &&
        data.recentCompletedScrims.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-zinc-900/30 p-6 text-center text-sm text-white/55">
            Belum ada aktivitas. Mulai scrim atau buat pengumuman pertama.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.recentAnnouncements.map((a) => (
              <li
                key={`a-${a.id}`}
                className="flex items-start gap-3 rounded-lg border border-white/5 bg-zinc-900/40 p-3"
              >
                <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-full bg-yellow-500/15 text-yellow-400">
                  <Megaphone className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {a.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-white/60">
                    {a.body}
                  </p>
                </div>
                <time className="flex-none text-[10px] uppercase tracking-wide text-white/40">
                  {formatRelative(a.created_at)}
                </time>
              </li>
            ))}
            {data.recentCompletedScrims.map((s) => (
              <li
                key={`s-${s.id}`}
                className="flex items-start gap-3 rounded-lg border border-white/5 bg-zinc-900/40 p-3"
              >
                <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <Swords className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    Scrim vs {s.opponent_name}
                  </p>
                  <p className="mt-0.5 text-xs text-white/60">
                    {s.format} · selesai
                  </p>
                </div>
                <time className="flex-none text-[10px] uppercase tracking-wide text-white/40">
                  {formatRelative(s.scheduled_at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/55">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}j`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}h`;
  const months = Math.floor(days / 30);
  return `${months}b`;
}
