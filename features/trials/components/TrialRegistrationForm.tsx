"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { registerApplicantAction } from "@/features/trials/actions";
import type { getTrialByToken } from "@/features/trials/queries";
import { cn } from "@/lib/utils/cn";

type TrialPublic = NonNullable<Awaited<ReturnType<typeof getTrialByToken>>>;

const inputCls = "h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none";

export function TrialRegistrationForm({ trial }: { trial: TrialPublic }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isFreeAgent, setIsFreeAgent] = useState(true);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      setErr(null);
      const res = await registerApplicantAction({
        trial_id: trial.id,
        name: fd.get("name"),
        ign: fd.get("ign"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        role_applied: fd.get("role_applied"),
        rank: fd.get("rank"),
        server: fd.get("server"),
        main_game: trial.game,
        secondary_game: fd.get("secondary_game"),
        is_free_agent: isFreeAgent,
        age: fd.get("age"),
        social_media: fd.get("social_media"),
      });
      if (res.ok) setDone(true);
      else setErr(res.message);
    });
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-10 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-400" />
        <p className="mt-4 text-base font-semibold text-[#E5E2E1]">Pendaftaran berhasil!</p>
        <p className="mt-1 text-sm text-[#9B9A97]">
          Cek WhatsApp kamu untuk konfirmasi. Tim akan menghubungi setelah seleksi.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-6 space-y-6">
      <div>
        <p className="text-xs text-[#9B9A97] uppercase tracking-wide">{trial.org_name}</p>
        <h1 className="mt-1 text-xl font-bold text-[#E5E2E1]">{trial.title}</h1>
        <p className="text-sm text-[#9B9A97]">{trial.game}</p>
        {trial.positions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {trial.positions.map((p) => (
              <span key={p} className="rounded-full bg-[#2C2C2C] px-2 py-0.5 text-xs text-[#9B9A97]">{p}</span>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Nama Lengkap <span className="text-red-400">*</span></label>
            <input name="name" type="text" required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">IGN (In-Game Name) <span className="text-red-400">*</span></label>
            <input name="ign" type="text" required className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">No. WhatsApp <span className="text-red-400">*</span></label>
            <input name="phone" type="tel" required inputMode="numeric" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Email <span className="text-red-400">*</span></label>
            <input name="email" type="email" required className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Umur <span className="text-red-400">*</span></label>
            <input name="age" type="number" min={10} max={99} required inputMode="numeric" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Role / Posisi Dilamar <span className="text-red-400">*</span></label>
            {trial.positions.length > 0 ? (
              <select name="role_applied" required className={inputCls}>
                <option value="">— Pilih posisi —</option>
                {trial.positions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            ) : (
              <input name="role_applied" type="text" required className={inputCls} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Rank Saat Ini <span className="text-red-400">*</span></label>
            <input name="rank" type="text" required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Server <span className="text-red-400">*</span></label>
            <input name="server" type="text" required className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#9B9A97] mb-1">Game Sampingan</label>
          <input name="secondary_game" type="text" className={inputCls} />
        </div>

        <div>
          <label className="block text-xs text-[#9B9A97] mb-1">Sosial Media <span className="text-red-400">*</span></label>
          <input name="social_media" type="text" required className={inputCls} />
        </div>

        {/* Free agent toggle */}
        <div className="flex items-center justify-between rounded-lg border border-[#2D2D2D] bg-[#191919] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[#E5E2E1]">Status</p>
            <p className="text-xs text-[#9B9A97]">{isFreeAgent ? "Free agent / tidak di tim manapun" : "Masih tergabung di tim lain"}</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" className="sr-only" checked={isFreeAgent} onChange={(e) => setIsFreeAgent(e.target.checked)} />
            <div className={cn("h-5 w-9 rounded-full transition-colors", isFreeAgent ? "bg-green-500" : "bg-[#2D2D2D]")}>
              <div className={cn("h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform", isFreeAgent ? "translate-x-[18px]" : "translate-x-0.5")} />
            </div>
          </label>
        </div>

        {err && (
          <p className="text-xs text-red-400 rounded border border-red-500/20 bg-red-500/10 px-3 py-2">{err}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#E5E2E1] text-sm font-semibold text-[#191919] hover:bg-white disabled:opacity-50 cursor-pointer"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Daftar Sekarang
        </button>
      </form>
    </div>
  );
}
