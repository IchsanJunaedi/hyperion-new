"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { notify } from "@/features/dashboard/components/NotifyModal";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";
import { forgotPasswordAction } from "@/app/(auth)/forgot-password/actions";

const ForgotPasswordForm = () => {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await forgotPasswordAction(values);
      if (!result.ok) {
        setServerError(result.message ?? "Terjadi kesalahan.");
        notify.error(result.message ?? "Terjadi kesalahan.");
        return;
      }
      setSent(true);
    });
  });

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ui-hover">
          <Mail className="h-6 w-6 text-ui-text-2" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-ui-text">Cek email kamu</p>
          <p className="text-sm text-ui-text-2">
            Link reset password dikirim ke{" "}
            <span className="font-medium text-ui-text">{getValues("email")}</span>.
            Cek juga folder spam jika tidak muncul.
          </p>
        </div>
        <Link
          href="/login"
          className="block text-sm text-ui-text-2 underline-offset-4 hover:underline"
        >
          Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="kamu@email.com"
          aria-invalid={errors.email ? "true" : undefined}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Mengirim…" : "Kirim Link Reset"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Kembali ke halaman masuk
        </Link>
      </p>
    </form>
  );
};
export { ForgotPasswordForm };
