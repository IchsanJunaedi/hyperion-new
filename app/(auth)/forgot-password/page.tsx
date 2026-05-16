import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Lupa Password",
  description: "Reset password akun Hyperion Team kamu.",
};

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl">Lupa Password?</CardTitle>
        <CardDescription>
          Masukkan email kamu dan kami akan mengirim link untuk reset password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  );
}
