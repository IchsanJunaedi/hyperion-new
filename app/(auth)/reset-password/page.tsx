import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Buat password baru untuk akun Hyperion Team kamu.",
};

export default function ResetPasswordPage() {
  return (
    <Card>
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl">Reset Password</CardTitle>
        <CardDescription>
          Buat password baru untuk akun kamu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}
