import { Trophy, Users } from "lucide-react";
import Link from "next/link";

import { logoutAction } from "@/lib/actions/auth";
import type { Database } from "@/types/database";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type Division = Database["public"]["Tables"]["divisions"]["Row"];

export interface PublicTeamProfileProps {
  organization: Organization;
  divisions: Division[];
  memberCount: number;
}

export function PublicTeamProfile({
  organization,
  divisions,
  memberCount,
}: PublicTeamProfileProps) {
  return (
    <main className="mx-auto max-w-4xl flex-1 px-6 py-12 sm:py-20">
      <header className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
        {organization.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={organization.logo_url}
            alt={organization.name}
            className="h-24 w-24 rounded-xl object-cover"
          />
        ) : (
          <div className="grid h-24 w-24 place-items-center rounded-xl bg-yellow-500/15 text-3xl font-bold text-yellow-400">
            {organization.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-xs uppercase tracking-wide text-white/55">
            Profil tim
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">
            {organization.name}
          </h1>
          {organization.description ? (
            <p className="mt-3 max-w-xl text-sm text-white/75 sm:text-base">
              {organization.description}
            </p>
          ) : null}
        </div>
      </header>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        <Stat label="Tier" value={organization.tier} icon={<Trophy />} />
        <Stat
          label="Anggota"
          value={memberCount.toString()}
          icon={<Users />}
        />
        <Stat
          label="Divisi"
          value={divisions.length.toString()}
          icon={<Users />}
        />
      </div>

      {divisions.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-white">Divisi</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {divisions.map((d) => (
              <li
                key={d.id}
                className="rounded-xl border border-white/10 bg-zinc-900/40 p-4"
              >
                <p className="text-base font-semibold text-white">{d.name}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-white/55">
                  {d.game}
                </p>
                {d.description ? (
                  <p className="mt-2 text-sm text-white/70">
                    {d.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-12 text-center text-xs text-white/45">
        Bagian dari{" "}
        <Link href="/" className="text-white/70 hover:text-white">
          Hyperion Team
        </Link>
        .
      </p>
      <div className="mt-4 text-center">
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-xs text-white/50 hover:text-white transition"
          >
            Logout
          </button>
        </form>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/55">
        <span className="grid h-4 w-4 place-items-center text-white/55">
          {icon}
        </span>
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold capitalize text-white">{value}</p>
    </div>
  );
}
