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
        .select("username, full_name, phone_wa, date_of_birth, bio, game_ids, social_links")
        .eq("id", user.id)
        .maybeSingle()
    : null;

  const gameIds =
    (profile?.data?.game_ids as Record<string, string> | null | undefined) ?? {};
  const socialLinks =
    (profile?.data?.social_links as Record<string, string> | null | undefined) ?? {};

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Lengkapi profil</CardTitle>
        <CardDescription>
          Isi data diri kamu. Data ini akan digunakan oleh tim untuk menghubungi
          dan mengenali kamu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileSetupForm
          defaultValues={{
            full_name: profile?.data?.full_name ?? "",
            username: profile?.data?.username ?? "",
            phone_wa: profile?.data?.phone_wa ?? "",
            date_of_birth: profile?.data?.date_of_birth ?? "",
            bio: "",
            social_links: {
              instagram: socialLinks.instagram ?? "",
              twitter: socialLinks.twitter ?? "",
              tiktok: socialLinks.tiktok ?? "",
              youtube: socialLinks.youtube ?? "",
              discord: socialLinks.discord ?? "",
            },
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
