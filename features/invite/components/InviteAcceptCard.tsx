"use client";

import { useState, useTransition } from "react";
import { notify } from "@/features/dashboard/components/NotifyModal";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  acceptInviteAction,
  rejectInviteAction,
} from "@/app/invite/[token]/actions";

interface InviteAcceptCardProps {
  token: string;
  orgName: string;
  orgSlug: string;
  divisionName: string | null;
  role: string;
  inviterName: string | null;
}

export function InviteAcceptCard({
  token,
  orgName,
  orgSlug,
  divisionName,
  role,
  inviterName,
}: InviteAcceptCardProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const accept = () => {
    setError(null);
    startTransition(async () => {
      const result = await acceptInviteAction(token);
      if (result?.error) {
        setError(result.error);
        notify.error(result.error);
      }
    });
  };

  const reject = () => {
    if (!confirm("Tolak undangan ini?")) return;
    setError(null);
    startTransition(async () => {
      const result = await rejectInviteAction(token);
      if (result?.error) {
        setError(result.error);
        notify.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-sm text-muted-foreground">
          {inviterName ? `${inviterName} mengundang kamu` : "Kamu diundang"} ke
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{orgName}</h1>
        <p className="text-xs text-muted-foreground">
          /{orgSlug}
          {divisionName ? <> · divisi {divisionName}</> : null} · sebagai{" "}
          <span className="font-medium text-foreground">{role}</span>
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={reject}
          disabled={pending}
        >
          Tolak
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={accept}
          disabled={pending}
        >
          {pending ? "Memproses…" : "Terima undangan"}
        </Button>
      </div>
    </div>
  );
}
