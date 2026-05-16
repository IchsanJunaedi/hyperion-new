"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { notify } from "@/features/dashboard/components/NotifyModal";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/utils/slug";
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from "@/lib/validations/onboarding";

import {
  checkSlugAvailability,
  createOrganizationAction,
} from "@/app/onboarding/organization/actions";
import { SupportedGameSelect } from "./SupportedGameSelect";

type SlugStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available" }
  | { kind: "unavailable"; reason: string };

const TIER_OPTIONS = [
  {
    value: "pelajar",
    label: "Pelajar",
    description: "Tim sekolah / kampus, kebutuhan dasar.",
  },
  {
    value: "komunitas",
    label: "Komunitas",
    description: "Tim komunitas atau scrim aktif.",
  },
  {
    value: "pro",
    label: "Pro",
    description: "Tim semi-pro / pro, custom domain & advanced.",
  },
] as const;

export function CreateOrganizationForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const slugTouchedRef = useRef(false);

  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      slug: "",
      tier: "komunitas",
      divisions: [{ name: "", game: "mobile_legends" }],
    },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "divisions",
  });

  const nameValue = watch("name");
  const slugValue = watch("slug");

  useEffect(() => {
    if (slugTouchedRef.current) return;
    setValue("slug", slugify(nameValue ?? ""), {
      shouldValidate: false,
      shouldDirty: false,
    });
  }, [nameValue, setValue]);

  useEffect(() => {
    if (!slugValue) {
      setSlugStatus({ kind: "idle" });
      return;
    }
    let cancelled = false;
    setSlugStatus({ kind: "checking" });
    const handle = window.setTimeout(async () => {
      try {
        const result = await checkSlugAvailability(slugValue);
        if (cancelled) return;
        if (result.available) {
          setSlugStatus({ kind: "available" });
        } else {
          setSlugStatus({
            kind: "unavailable",
            reason: result.reason ?? "Slug tidak tersedia",
          });
        }
      } catch {
        if (!cancelled) setSlugStatus({ kind: "idle" });
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [slugValue]);

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    if (slugStatus.kind === "unavailable") {
      setServerError(slugStatus.reason);
      return;
    }
    startTransition(async () => {
      const result = await createOrganizationAction(values);
      if (result?.error) {
        setServerError(result.error);
        notify.error(result.error);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <section className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-name">Nama tim</Label>
          <Input
            id="org-name"
            type="text"
            placeholder="Mis. Hyperion Six"
            aria-invalid={errors.name ? "true" : undefined}
            {...register("name")}
          />
          {errors.name ? (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="org-slug">Slug URL tim</Label>
          <div className="flex items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <span className="flex items-center px-3 text-xs text-muted-foreground">
              hyperionteam.id/
            </span>
            <input
              id="org-slug"
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="hyperion-six"
              className="h-10 flex-1 bg-transparent px-2 text-sm focus:outline-none"
              aria-invalid={errors.slug ? "true" : undefined}
              {...register("slug", {
                onChange: () => {
                  slugTouchedRef.current = true;
                },
              })}
            />
          </div>
          <SlugStatusBadge status={slugStatus} />
          {errors.slug ? (
            <p className="text-xs text-destructive">{errors.slug.message}</p>
          ) : null}
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium leading-none">
            Tier paket
          </legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {TIER_OPTIONS.map((tier) => (
              <label
                key={tier.value}
                className="flex cursor-pointer flex-col gap-1 rounded-md border border-input bg-background p-3 text-sm transition-colors hover:bg-accent has-[input:checked]:border-foreground has-[input:checked]:bg-accent"
              >
                <input
                  type="radio"
                  value={tier.value}
                  className="sr-only"
                  {...register("tier")}
                />
                <span className="font-semibold">{tier.label}</span>
                <span className="text-xs text-muted-foreground">
                  {tier.description}
                </span>
              </label>
            ))}
          </div>
          {errors.tier ? (
            <p className="text-xs text-destructive">{errors.tier.message}</p>
          ) : null}
        </fieldset>
      </section>

      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Divisi awal</h2>
            <p className="text-sm text-muted-foreground">
              Minimal satu divisi (mis. Mobile Legends, Valorant). Bisa
              ditambah lagi nanti.
            </p>
          </div>
          {fields.length < 10 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", game: "mobile_legends" })}
            >
              <Plus className="size-4" /> Tambah
            </Button>
          ) : null}
        </header>

        <ul className="space-y-2">
          {fields.map((field, index) => (
            <li
              key={field.id}
              className="grid grid-cols-1 gap-2 rounded-md border border-input bg-background p-3 sm:grid-cols-[1fr_180px_auto]"
            >
              <div className="space-y-1">
                <Label
                  htmlFor={`division-name-${index}`}
                  className="text-xs uppercase tracking-wide text-muted-foreground"
                >
                  Nama divisi
                </Label>
                <Input
                  id={`division-name-${index}`}
                  type="text"
                  placeholder="Mis. MLBB Main"
                  {...register(`divisions.${index}.name`)}
                />
                {errors.divisions?.[index]?.name ? (
                  <p className="text-xs text-destructive">
                    {errors.divisions?.[index]?.name?.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor={`division-game-${index}`}
                  className="text-xs uppercase tracking-wide text-muted-foreground"
                >
                  Game
                </Label>
                <SupportedGameSelect
                  id={`division-game-${index}`}
                  {...register(`divisions.${index}.game`)}
                />
              </div>
              <div className="flex items-end justify-end">
                {fields.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Hapus divisi"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        {errors.divisions?.message ? (
          <p className="text-xs text-destructive">
            {errors.divisions.message}
          </p>
        ) : null}
      </section>

      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={pending || slugStatus.kind === "checking"}
        >
          {pending ? "Membuat tim…" : "Buat tim"}
        </Button>
      </div>
    </form>
  );
}

function SlugStatusBadge({ status }: { status: SlugStatus }) {
  if (status.kind === "idle") return null;
  if (status.kind === "checking") {
    return (
      <p className="text-xs text-muted-foreground">Memeriksa ketersediaan…</p>
    );
  }
  if (status.kind === "available") {
    return (
      <p className="text-xs text-emerald-600 dark:text-emerald-400">
        Slug tersedia.
      </p>
    );
  }
  return <p className="text-xs text-destructive">{status.reason}</p>;
}
