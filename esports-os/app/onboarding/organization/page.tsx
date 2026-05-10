import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateOrganizationForm } from "@/features/onboarding/components/CreateOrganizationForm";

export const metadata: Metadata = {
  title: "Buat atau gabung tim",
};

export default function OrganizationOnboardingPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Buat tim baru</CardTitle>
          <CardDescription>
            Setiap tim punya workspace sendiri: scrim, kalender, roster, dan
            chat. Kamu otomatis jadi owner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrganizationForm />
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">
            Diundang ke tim yang sudah ada?
          </CardTitle>
          <CardDescription>
            Buka link undangan yang dikirim captain / manager kamu. Link
            biasanya dimulai dengan{" "}
            <span className="font-mono text-foreground">/invite/...</span>.
            Atau{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              minta ulang link
            </Link>
            .
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
