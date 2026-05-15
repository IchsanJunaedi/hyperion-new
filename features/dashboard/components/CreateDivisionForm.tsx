"use client";

import { Loader2, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createDivisionAction } from "../actions";
import { useNotify } from "./NotifyModal";

export function CreateDivisionForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { success, error: notifyError } = useNotify();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending || !name.trim()) return;

    startTransition(async () => {
      setError(null);
      const res = await createDivisionAction(name.trim());
      if (res.ok) {
        success(`Divisi "${name}" berhasil dibuat`);
        setName("");
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-xs text-white/50">
        Buat divisi baru yang bisa dipakai di semua tim. Contoh: Mobile Legends, Valorant, Free Fire.
      </p>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama divisi baru"
          maxLength={60}
          className="h-9 flex-1 rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="inline-flex h-9 items-center gap-1 rounded-md bg-yellow-400 px-3 text-xs font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Buat
        </button>
      </div>
      {error && (
        <p className="text-xs text-rose-400">{error}</p>
      )}
    </form>
  );
}
