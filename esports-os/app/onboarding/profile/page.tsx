import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ProfileSetupForm } from "@/features/onboarding/components/ProfileSetupForm";

export const metadata: Metadata = {
  title: "Lengkapi profil",
};

export default async function ProfileOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user
    ? await supabase
        .from("profiles")
        .select("username, bio, game_ids")
        .eq("id", user.id)
        .maybeSingle()
    : null;

  const gameIds =
    (profile?.data?.game_ids as Record<string, string> | null | undefined) ??
    {};

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Lengkapi profil</CardTitle>
        <CardDescription>
          Pilih username dan isi game ID kamu. Bisa diubah lagi nanti di
          pengaturan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileSetupForm
          defaultValues={{
            username: profile?.data?.username ?? "",
            bio: profile?.data?.bio ?? "",
            game_ids: {
              mlbb: gameIds.mlbb ?? "",
              mlbb_server: gameIds.mlbb_server ?? "",
              valorant: gameIds.valorant ?? "",
              pubg: gameIds.pubg ?? "",
              ff: gameIds.ff ?? "",
            },
          }}
        />
      </CardContent>
    </Card>
  );
}
