"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  profileSetupSchema,
  type ProfileSetupInput,
} from "@/lib/validations/onboarding";

import { saveProfileAction } from "@/app/onboarding/profile/actions";

interface ProfileSetupFormProps {
  defaultValues: Partial<ProfileSetupInput>;
}

export function ProfileSetupForm({ defaultValues }: ProfileSetupFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileSetupInput>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      username: defaultValues.username ?? "",
      bio: defaultValues.bio ?? "",
      game_ids: {
        mlbb: defaultValues.game_ids?.mlbb ?? "",
        mlbb_server: defaultValues.game_ids?.mlbb_server ?? "",
        valorant: defaultValues.game_ids?.valorant ?? "",
        pubg: defaultValues.game_ids?.pubg ?? "",
        ff: defaultValues.game_ids?.ff ?? "",
      },
    },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await saveProfileAction(values);
      if (result?.error) {
        setServerError(result.error);
        toast.error(result.error);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <section className="space-y-4">
        <header>
          <h2 className="text-base font-semibold">Identitas kamu</h2>
          <p className="text-sm text-muted-foreground">
            Username dipakai sebagai handle publik tim. Game ID opsional —
            bisa diisi nanti.
          </p>
        </header>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            autoComplete="off"
            placeholder="mis. andika_pro"
            aria-invalid={errors.username ? "true" : undefined}
            {...register("username")}
          />
          <p className="text-xs text-muted-foreground">
            3–24 karakter, huruf kecil, angka, dan _ saja.
          </p>
          {errors.username ? (
            <p className="text-xs text-destructive">
              {errors.username.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio (opsional)</Label>
          <textarea
            id="bio"
            rows={3}
            maxLength={280}
            placeholder="Tulis singkat tentang kamu — peran main, jam aktif, dll."
            className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("bio")}
          />
          {errors.bio ? (
            <p className="text-xs text-destructive">{errors.bio.message}</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <header>
          <h2 className="text-base font-semibold">Game ID</h2>
          <p className="text-sm text-muted-foreground">
            Diisi sesuai game yang kamu aktif main. Boleh kosongkan yang tidak
            relevan.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="mlbb">Mobile Legends ID</Label>
            <Input
              id="mlbb"
              type="text"
              placeholder="123456789"
              {...register("game_ids.mlbb")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mlbb_server">MLBB Server ID</Label>
            <Input
              id="mlbb_server"
              type="text"
              placeholder="2345"
              {...register("game_ids.mlbb_server")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="valorant">Valorant Riot ID</Label>
            <Input
              id="valorant"
              type="text"
              placeholder="Nama#TAG"
              {...register("game_ids.valorant")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pubg">PUBG Mobile ID</Label>
            <Input
              id="pubg"
              type="text"
              placeholder="5123456789"
              {...register("game_ids.pubg")}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ff">Free Fire ID</Label>
            <Input
              id="ff"
              type="text"
              placeholder="123456789"
              {...register("game_ids.ff")}
            />
          </div>
        </div>
      </section>

      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Lanjut"}
        </Button>
      </div>
    </form>
  );
}
