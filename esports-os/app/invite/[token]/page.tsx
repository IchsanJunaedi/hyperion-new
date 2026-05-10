import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { InviteAcceptCard } from "@/features/invite/components/InviteAcceptCard";

export const metadata: Metadata = {
  title: "Undangan tim",
};

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  const admin = createAdminClient();
  const inviteResp = await admin
    .from("organization_invites")
    .select(
      "id, organization_id, division_id, role, status, expires_at, invited_by",
    )
    .eq("token", token)
    .maybeSingle();

  const invite = inviteResp.data;

  if (!invite) {
    return (
      <InviteShell>
        <Card>
          <CardHeader>
            <CardTitle>Undangan tidak ditemukan</CardTitle>
            <CardDescription>
              Link sudah dihapus atau salah ketik. Minta captain / manager
              kamu untuk kirim ulang.
            </CardDescription>
          </CardHeader>
        </Card>
      </InviteShell>
    );
  }

  const expired =
    invite.status === "expired" || new Date(invite.expires_at) < new Date();

  const [orgResp, divisionResp, inviterResp] = await Promise.all([
    admin
      .from("organizations")
      .select("name, slug")
      .eq("id", invite.organization_id)
      .maybeSingle(),
    invite.division_id
      ? admin
          .from("divisions")
          .select("name")
          .eq("id", invite.division_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("profiles")
      .select("display_name")
      .eq("id", invite.invited_by)
      .maybeSingle(),
  ]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <InviteShell>
        <Card>
          <CardHeader>
            <CardTitle>Masuk dulu untuk gabung</CardTitle>
            <CardDescription>
              Kamu diundang ke{" "}
              <span className="font-semibold text-foreground">
                {orgResp.data?.name ?? "tim"}
              </span>
              . Masuk atau daftar untuk menerima undangan.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
              className="flex-1 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Masuk
            </Link>
            <Link
              href={`/register?next=${encodeURIComponent(`/invite/${token}`)}`}
              className="flex-1 inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
            >
              Daftar
            </Link>
          </CardContent>
        </Card>
      </InviteShell>
    );
  }

  if (expired) {
    return (
      <InviteShell>
        <Card>
          <CardHeader>
            <CardTitle>Undangan kadaluarsa</CardTitle>
            <CardDescription>
              Link undangan ini sudah lewat masa berlakunya. Minta captain
              untuk kirim link baru.
            </CardDescription>
          </CardHeader>
        </Card>
      </InviteShell>
    );
  }

  return (
    <InviteShell>
      <Card>
        <CardContent className="pt-6">
          <InviteAcceptCard
            token={token}
            orgName={orgResp.data?.name ?? "Tim"}
            orgSlug={orgResp.data?.slug ?? ""}
            divisionName={divisionResp.data?.name ?? null}
            role={invite.role}
            inviterName={inviterResp.data?.display_name ?? null}
          />
        </CardContent>
      </Card>
    </InviteShell>
  );
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center px-4">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Hyperion Team
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
