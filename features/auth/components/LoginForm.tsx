"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

import { signInAction } from "@/app/(auth)/login/actions";
import { GoogleOAuthButton } from "./GoogleOAuthButton";

interface LoginFormProps {
  /** Post-login redirect target (read from `?next=` on the page). */
  next?: string;
}

export function LoginForm({ next = "/" }: LoginFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await signInAction({ ...values, next });
      if (result?.error) {
        setServerError(result.error);
        toast.error(result.error);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? "true" : undefined}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Lupa password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? "true" : undefined}
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Memproses…" : "Masuk"}
      </Button>

      <div className="relative my-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        atau
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleOAuthButton next={next} />

      <p className="text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link
          href={`/register${next && next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Daftar
        </Link>
      </p>
    </form>
  );
}
