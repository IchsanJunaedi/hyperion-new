"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

import { signUpAction } from "@/app/(auth)/register/actions";
import { GoogleOAuthButton } from "./GoogleOAuthButton";

interface RegisterFormProps {
  next?: string;
}

export function RegisterForm({ next = "/onboarding/profile" }: RegisterFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      display_name: "",
      email: "",
      password: "",
      phone_wa: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    setNeedsConfirm(null);
    startTransition(async () => {
      const result = await signUpAction({ ...values, next });
      if (result?.error) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }
      if (result?.needsEmailConfirmation) {
        setNeedsConfirm(values.email);
      }
    });
  });

  if (needsConfirm) {
    return (
      <Alert variant="success">
        <AlertTitle>Cek email kamu</AlertTitle>
        <AlertDescription>
          Kami sudah mengirim link konfirmasi ke{" "}
          <span className="font-medium">{needsConfirm}</span>. Buka link itu
          untuk mengaktifkan akun, lalu lanjut isi profil tim.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="display_name">Nama lengkap</Label>
        <Input
          id="display_name"
          type="text"
          autoComplete="name"
          placeholder="Mis. Andika Putra"
          aria-invalid={errors.display_name ? "true" : undefined}
          {...register("display_name")}
        />
        {errors.display_name ? (
          <p className="text-xs text-destructive">
            {errors.display_name.message}
          </p>
        ) : null}
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Minimal 8 karakter, huruf + angka"
          aria-invalid={errors.password ? "true" : undefined}
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone_wa">Nomor WhatsApp</Label>
        <Input
          id="phone_wa"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0812xxxxxxxx atau +6281xxxxxxxx"
          aria-invalid={errors.phone_wa ? "true" : undefined}
          {...register("phone_wa")}
        />
        <p className="text-xs text-muted-foreground">
          Dipakai buat notifikasi scrim, undangan tim, dan reminder via
          WhatsApp.
        </p>
        {errors.phone_wa ? (
          <p className="text-xs text-destructive">{errors.phone_wa.message}</p>
        ) : null}
      </div>

      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Memproses…" : "Daftar"}
      </Button>

      <div className="relative my-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        atau
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleOAuthButton next={next} label="Daftar dengan Google" />

      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Masuk
        </Link>
      </p>
    </form>
  );
}
