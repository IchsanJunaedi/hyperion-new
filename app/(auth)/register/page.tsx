import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun baru untuk membangun workspace tim esports kamu.",
};

interface RegisterPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const { next } = await searchParams;
  return (
    <Card>
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl">Daftar</CardTitle>
        <CardDescription>
          Mulai kelola scrim, roster, dan jadwal tim kamu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm next={next} />
      </CardContent>
    </Card>
  );
}
