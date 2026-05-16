"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth";
import { resetPasswordAction } from "@/app/(auth)/reset-password/actions";

export function ResetPasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await resetPasswordAction(values);
      if (!result.ok) {
        setServerError(result.message ?? "Terjadi kesalahan.");
        toast.error(result.message ?? "Terjadi kesalahan.");
        return;
      }
      toast.success("Password berhasil diubah. Silakan masuk kembali.");
      router.push("/login");
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="password">Password Baru</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? "true" : undefined}
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.confirmPassword ? "true" : undefined}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p className="text-xs text-destructive">
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <p className="text-xs text-[#6B6A68]">
        Password minimal 8 karakter, mengandung huruf kapital, angka, dan karakter spesial (. ! @ #).
      </p>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Menyimpan…" : "Simpan Password Baru"}
      </Button>
    </form>
  );
}
